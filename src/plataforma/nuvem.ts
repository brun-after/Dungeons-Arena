// Progresso na nuvem (marco 17, 15/10/2026, D-063). O jogo nunca depende dela: o save local é a fonte, e a nuvem só
// guarda uma cópia por conta (login Google) para continuar noutra máquina.
//
// Econômica, para caber no plano grátis do Supabase:
// - nada de realtime nem de leitura periódica: a lista dos saves da nuvem é lida **uma vez por aba** (fica no
//   sessionStorage) e o registro inteiro só quando a pessoa pede "Baixar";
// - escrita só em "Enviar para a nuvem" e nos pontos combinados (salvar pelo menu, sair do grupo, sair da arena);
// - a biblioteca é carregada sob demanda, fora do boot.
//
// A chave anônima do Supabase é pública (o RLS da tabela `saves` só deixa cada conta ler e gravar o que é dela).

import type { SupabaseClient } from '@supabase/supabase-js';
import { jogadorDoSave, lerRegistro, resumoDoRegistro, type RegistroProgresso } from '../save/esquema';
import { certificarSlot } from './certificacao';
import { carregarSlot } from './saves';
import { ehAppNativo } from './nativo';
import { enderecoDoServidor } from './servidor';

export interface SaveNaNuvem {
  slot: number;
  nivel: number;
  nomeFase: string;
  atualizadoEm: number;
}

export interface UsuarioDaNuvem {
  nome: string;
}

export interface Nuvem {
  usuario: () => Promise<UsuarioDaNuvem | null>;
  /** Login com Google (sai da página e volta logado). */
  entrar: () => Promise<void>;
  sair: () => Promise<void>;
  /** A lista dos saves da conta (uma leitura por aba; `forcar` lê de novo). */
  listar: (forcar?: boolean) => Promise<SaveNaNuvem[]>;
  enviar: (r: RegistroProgresso) => Promise<void>;
  /** O registro do slot, migrado e conferido como um arquivo importado (null: não há). */
  baixar: (slot: number) => Promise<RegistroProgresso | null>;
  /**
   * Marco 18 (D-070): tenta registrar a primeira descoberta do servidor e devolve quem chegou primeiro (null: sem
   * conta ou sem rede). O servidor atribui um pseudônimo; o nome Google não é publicado.
   */
  registrarDescoberta: (entrada: string) => Promise<PrimeiraDescoberta | null>;
  /** Marco 29 (D-128): o token da sessão, que o servidor do Mundo confere (null: sem conta). */
  token: () => Promise<string | null>;
}

/** Quem descobriu primeiro uma entrada do diário (e se foi esta conta). */
export interface PrimeiraDescoberta {
  nome: string;
  em: number;
  minha: boolean;
}

const CHAVE_LISTA = 'dungeons-arena:nuvem-lista';

function resumoDaNuvem(r: RegistroProgresso): Omit<SaveNaNuvem, 'slot'> & { classe: string } {
  const resumo = resumoDoRegistro(r);
  return { nivel: resumo.nivel, nomeFase: resumo.nomeFase, atualizadoEm: r.atualizadoEm, classe: jogadorDoSave(r.estado)?.bolsa?.classeId ?? '' };
}

function lerListaGuardada(): SaveNaNuvem[] | null {
  try {
    const texto = sessionStorage.getItem(CHAVE_LISTA);
    return texto ? (JSON.parse(texto) as SaveNaNuvem[]) : null;
  } catch {
    return null;
  }
}

function guardarLista(lista: SaveNaNuvem[] | null): void {
  try {
    if (lista) sessionStorage.setItem(CHAVE_LISTA, JSON.stringify(lista));
    else sessionStorage.removeItem(CHAVE_LISTA);
  } catch {
    // Sem sessionStorage: a próxima abertura lê de novo.
  }
}

/** Atualiza a lista guardada depois de uma escrita (sem ler a nuvem de novo). */
function listaComEnvio(lista: SaveNaNuvem[] | null, r: RegistroProgresso): SaveNaNuvem[] | null {
  if (!lista) return null;
  const novo = { slot: r.slot, ...resumoDaNuvem(r) };
  return [...lista.filter((s) => s.slot !== r.slot), { slot: novo.slot, nivel: novo.nivel, nomeFase: novo.nomeFase, atualizadoEm: novo.atualizadoEm }].sort((a, b) => a.slot - b.slot);
}

/** Supabase (Google, sem realtime). As variáveis vêm do build do Pages; sem elas, não há nuvem. */
/** Marco 20 (D-087): a volta do login Google para o app Android (intent-filter no AndroidManifest). */
export const VOLTA_DO_LOGIN_NO_APP = 'io.github.brunafter.dungeonsarena://login';

/**
 * Login no app Android: o Google abre no navegador do sistema (o WebView não pode fazer OAuth) e volta pelo deep link
 * com o código do PKCE, trocado aqui pela sessão. Depois, a tela dos slots recarrega já com a conta.
 */
async function entrarNoApp(c: SupabaseClient): Promise<void> {
  const { data, error } = await c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: VOLTA_DO_LOGIN_NO_APP, skipBrowserRedirect: true } });
  if (error) throw new Error(error.message);
  const [{ App }, { Browser }] = await Promise.all([import('@capacitor/app'), import('@capacitor/browser')]);
  const ouvinte = await App.addListener('appUrlOpen', ({ url }) => {
    if (!url.startsWith(VOLTA_DO_LOGIN_NO_APP)) return;
    void ouvinte.remove();
    void Browser.close().catch(() => undefined);
    const codigo = new URL(url).searchParams.get('code');
    void (codigo ? c.auth.exchangeCodeForSession(codigo) : Promise.resolve())
      .catch(() => undefined)
      .then(() => {
        location.href = './?jogo=campanha';
      });
  });
  await Browser.open({ url: data.url });
}

export function criarNuvemSupabase(url: string, chaveAnonima: string): Nuvem {
  const cliente = import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(url, chaveAnonima, { auth: { persistSession: true, detectSessionInUrl: true, flowType: 'pkce' } }),
  );
  const idDoUsuario = async () => (await (await cliente).auth.getSession()).data.session?.user.id ?? null;
  return {
    token: async () => (await (await cliente).auth.getSession()).data.session?.access_token ?? null,
    usuario: async () => {
      const sessao = (await (await cliente).auth.getSession()).data.session;
      if (!sessao) return null;
      const meta = sessao.user.user_metadata as { full_name?: unknown; name?: unknown };
      const nome = typeof meta.full_name === 'string' ? meta.full_name : typeof meta.name === 'string' ? meta.name : (sessao.user.email ?? '');
      return { nome };
    },
    entrar: async () => {
      if (ehAppNativo()) {
        await entrarNoApp(await cliente);
        return;
      }
      const volta = `${location.origin}${location.pathname}?jogo=campanha`;
      await (await cliente).auth.signInWithOAuth({ provider: 'google', options: { redirectTo: volta } });
    },
    sair: async () => {
      guardarLista(null);
      await (await cliente).auth.signOut();
    },
    listar: async (forcar = false) => {
      const guardada = forcar ? null : lerListaGuardada();
      if (guardada) return guardada;
      const { data, error } = await (await cliente).from('saves').select('slot, resumo');
      if (error) throw new Error(error.message);
      // O que vem da tabela é dado de fora: confere cada campo.
      const lista = (data as { slot: number; resumo: Record<string, unknown> | null }[]).map((l) => ({
        slot: l.slot,
        nivel: typeof l.resumo?.nivel === 'number' ? l.resumo.nivel : 1,
        nomeFase: typeof l.resumo?.nomeFase === 'string' ? l.resumo.nomeFase : '',
        atualizadoEm: typeof l.resumo?.atualizadoEm === 'number' ? l.resumo.atualizadoEm : 0,
      }));
      guardarLista(lista);
      return lista;
    },
    enviar: async (r) => {
      const id = await idDoUsuario();
      if (!id) throw new Error('sem_login');
      const { error } = await (await cliente)
        .from('saves')
        .upsert({ user_id: id, slot: r.slot, resumo: resumoDaNuvem(r), registro: r, atualizado_em: new Date(r.atualizadoEm).toISOString() });
      if (error) throw new Error(error.message);
      guardarLista(listaComEnvio(lerListaGuardada(), r));
    },
    baixar: async (slot) => {
      const { data, error } = await (await cliente).from('saves').select('registro').eq('slot', slot).maybeSingle();
      if (error) throw new Error(error.message);
      const bruto = (data as { registro?: unknown } | null)?.registro;
      if (!bruto) return null;
      const leitura = lerRegistro(bruto);
      return leitura.ok ? leitura.registro : null;
    },
    registrarDescoberta: async (entrada) => {
      const sessao = (await (await cliente).auth.getSession()).data.session;
      if (!sessao) return null;
      // D-071: registro e leitura atômicos; a resposta não expõe o identificador da conta do descobridor.
      const resposta = await (await cliente).rpc('registrar_descoberta', { p_entrada: entrada });
      const data: unknown = resposta.data;
      const error = resposta.error;
      if (error || !Array.isArray(data) || !data[0]) return null;
      const linha = data[0] as { nome?: unknown; criado_em?: unknown; minha?: unknown };
      return {
        nome: typeof linha.nome === 'string' ? linha.nome : 'Alguém',
        em: typeof linha.criado_em === 'string' ? Date.parse(linha.criado_em) : Date.now(),
        minha: linha.minha === true,
      };
    },
  };
}

/** Nuvem em memória (testes e `?nuvem=falsa`): mesma interface, guardada no sessionStorage da aba. */
export function criarNuvemFalsa(): Nuvem {
  const CHAVE = 'dungeons-arena:nuvem-falsa';
  const ler = (): { logado: boolean; saves: Record<string, unknown> } => {
    try {
      return JSON.parse(sessionStorage.getItem(CHAVE) ?? '{"logado":false,"saves":{}}') as { logado: boolean; saves: Record<string, unknown> };
    } catch {
      return { logado: false, saves: {} };
    }
  };
  const gravar = (v: { logado: boolean; saves: Record<string, unknown> }) => {
    sessionStorage.setItem(CHAVE, JSON.stringify(v));
  };
  return {
    // O servidor sem nuvem aceita a conta `local:` (testes e desenvolvimento).
    token: () => Promise.resolve(ler().logado ? 'local:pessoa-de-teste' : null),
    usuario: () => Promise.resolve(ler().logado ? { nome: 'Pessoa de teste' } : null),
    entrar: () => {
      gravar({ ...ler(), logado: true });
      location.reload();
      return Promise.resolve();
    },
    sair: () => {
      gravar({ ...ler(), logado: false });
      return Promise.resolve();
    },
    listar: () =>
      Promise.resolve(
        Object.values(ler().saves)
          .map((b) => lerRegistro(b))
          .flatMap((l) => (l.ok ? [{ slot: l.registro.slot, ...resumoDaNuvem(l.registro) }] : []))
          .map(({ slot, nivel, nomeFase, atualizadoEm }) => ({ slot, nivel, nomeFase, atualizadoEm })),
      ),
    enviar: (r) => {
      const v = ler();
      if (!v.logado) return Promise.reject(new Error('sem_login'));
      gravar({ ...v, saves: { ...v.saves, [String(r.slot)]: r } });
      return Promise.resolve();
    },
    baixar: (slot) => {
      const bruto = ler().saves[String(slot)];
      const l = bruto ? lerRegistro(bruto) : null;
      return Promise.resolve(l?.ok ? l.registro : null);
    },
    registrarDescoberta: (entrada) => {
      if (!ler().logado) return Promise.resolve(null);
      const CHAVE_DESC = 'dungeons-arena:nuvem-falsa-descobertas';
      const todas = ((): Record<string, { nome: string; em: number }> => {
        try {
          return JSON.parse(sessionStorage.getItem(CHAVE_DESC) ?? '{}') as Record<string, { nome: string; em: number }>;
        } catch {
          return {};
        }
      })();
      const ja = todas[entrada];
      if (ja) return Promise.resolve({ ...ja, minha: ja.nome === 'Pessoa' });
      const nova = { nome: 'Pessoa', em: Date.now() };
      sessionStorage.setItem(CHAVE_DESC, JSON.stringify({ ...todas, [entrada]: nova }));
      return Promise.resolve({ ...nova, minha: true });
    },
  };
}

/** A nuvem deste build: a falsa por `?nuvem=falsa`, a do Supabase com as variáveis do build, ou nenhuma. */
export function nuvemDoBuild(): Nuvem | null {
  if (new URLSearchParams(location.search).get('nuvem') === 'falsa') return criarNuvemFalsa();
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const chave = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  return url && chave ? criarNuvemSupabase(url, chave) : null;
}

/** Envia o slot para a nuvem se houver conta logada; nunca lança (o jogo segue). Devolve se enviou. */
export async function enviarSeLogado(r: RegistroProgresso): Promise<boolean> {
  const nuvem = nuvemDoBuild();
  try {
    if (!nuvem || !(await nuvem.usuario())) return false;
    await nuvem.enviar(r);
    return true;
  } catch {
    return false;
  }
}

/**
 * Nos pontos combinados (salvar pelo menu, sair do grupo, sair da arena): certifica o personagem do slot quando há
 * servidor e envia o slot quando há conta logada. Tudo opcional e com tempo máximo: quem chama nunca fica preso.
 */
export async function sincronizarSlot(slot: number, esperaMaxMs = 5000): Promise<void> {
  const trabalho = (async () => {
    const servidor = enderecoDoServidor();
    if (servidor) await certificarSlot(servidor, slot).catch(() => null);
    const r = await carregarSlot(slot).catch(() => null);
    if (r && r !== 'invalido') await enviarSeLogado(r);
  })();
  await Promise.race([trabalho.catch(() => undefined), new Promise((r) => setTimeout(r, esperaMaxMs))]);
}
