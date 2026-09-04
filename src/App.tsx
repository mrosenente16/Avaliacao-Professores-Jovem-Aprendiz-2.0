import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, ClipboardCheck, History, Users, FileText, GitCompare,
  Settings, Plus, X, Printer, Trash2, Search, Check, AlertCircle, ChevronRight,
  UserCircle2, Calendar, Filter, RotateCcw, Download
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";
import "./App.css";

/* ---------------------------------------------------------------------- */
/* DADOS FIXOS DO MODELO DE AVALIAÇÃO                                     */
/* ---------------------------------------------------------------------- */

const ESCALA = [
  { v: 1, label: "Insatisfatório", cor: "#C1443C" },
  { v: 2, label: "Regular", cor: "#D9822F" },
  { v: 3, label: "Bom", cor: "#D9B23A" },
  { v: 4, label: "Muito Bom", cor: "#6FA050" },
  { v: 5, label: "Excelente", cor: "#1E6B43" },
];

const AREAS = [
  {
    id: "planejamento",
    nome: "Planejamento e Organização dos Treinamentos",
    criterios: [
      { id: "p1", label: "As atividades apresentam objetivos claros" },
      { id: "p2", label: "Estrutura da sessão de treinamento (Integração, Play Maker, Jogo)" },
      { id: "p3", label: "Organização do tempo e do espaço" },
      { id: "p4", label: "Feedback da atividade proposta pelo instrutor" },
    ],
  },
  {
    id: "gestao",
    nome: "Gestão da Turma",
    criterios: [
      { id: "g1", label: "Promove um ambiente positivo de aprendizagem" },
      { id: "g2", label: "O professor incentiva a tomada de decisão" },
      { id: "g3", label: "Estabelece regras claras e incentiva atitudes de respeito, cooperação e espírito esportivo" },
      { id: "g4", label: "Consegue conduzir o grupo de forma organizada" },
    ],
  },
  {
    id: "postura",
    nome: "Postura Profissional",
    criterios: [
      { id: "po1", label: "Conhecimento teórico e prática da sua modalidade" },
      { id: "po2", label: "Aplicação do Fair Play / Resolução de conflitos" },
      { id: "po3", label: "Capacidade de observação e correção" },
      { id: "po4", label: "Planejamento do treinamento" },
    ],
  },
  {
    id: "aprendizagem",
    nome: "Avaliação da Aprendizagem",
    criterios: [
      { id: "ap1", label: "Pontualidade e organização" },
      { id: "ap2", label: "Vínculo com os aprendizes" },
      { id: "ap3", label: "Ética e responsabilidade" },
      { id: "ap4", label: "Comprometimento institucional" },
    ],
  },
];

const TODOS_CRITERIOS = AREAS.flatMap((a) => a.criterios.map((c) => ({ ...c, areaId: a.id })));

/* ---------------------------------------------------------------------- */
/* FUNÇÕES AUXILIARES                                                     */
/* ---------------------------------------------------------------------- */

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function classify(media: number) {
  if (media >= 4.2) return "Excelente";
  if (media >= 3.4) return "Muito Bom";
  if (media >= 2.6) return "Bom";
  if (media >= 1.8) return "Regular";
  return "Insatisfatório";
}

function corClassificacao(classificacao: string) {
  const item = ESCALA.find((e) => e.label === classificacao);
  return item ? item.cor : "#8A8A8A";
}

function calcAvaliacao(criterios: Record<string, number>) {
  const vals = TODOS_CRITERIOS.map((c) => criterios[c.id]).filter((v) => typeof v === "number");
  const total = vals.reduce((a, b) => a + b, 0);
  const media = vals.length ? total / vals.length : 0;
  const areaMedia: Record<string, number> = {};
  AREAS.forEach((area) => {
    const areaVals = area.criterios.map((c) => criterios[c.id]).filter((v) => typeof v === "number");
    areaMedia[area.id] = areaVals.length ? areaVals.reduce((a, b) => a + b, 0) / areaVals.length : 0;
  });
  const completo = vals.length === 16;
  return {
    total: completo ? total : null,
    media,
    percentual: completo ? (total / 80) * 100 : (media / 5) * 100,
    areaMedia,
    classificacao: classify(media),
    completo,
    preenchidos: vals.length,
  };
}

function formatDateBR(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function mediaFmt(n: number) {
  return (n || 0).toFixed(2).replace(".", ",");
}
function pctFmt(n: number) {
  return `${(n || 0).toFixed(1).replace(".", ",")}%`;
}

function downloadCSV(filename: string, csvData: string) {
  const blob = new Blob(["\uFEFF" + csvData], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const NAV = [
  { id: "dashboard", label: "Painel", icon: LayoutDashboard },
  { id: "avaliar", label: "Nova Avaliação", icon: ClipboardCheck },
  { id: "historico", label: "Histórico", icon: History },
  { id: "professores", label: "Professores", icon: Users },
  { id: "relatorio", label: "Relatório Anual", icon: FileText },
  { id: "comparar", label: "Comparar", icon: GitCompare },
  { id: "cadastros", label: "Cadastros", icon: Settings },
];

/* ---------------------------------------------------------------------- */
/* COMPONENTES PEQUENOS                                                   */
/* ---------------------------------------------------------------------- */

function Badge({ classificacao, size = "md" }: { classificacao: string; size?: string }) {
  const cor = corClassificacao(classificacao);
  return (
    <span
      className={`badge badge-${size}`}
      style={{ background: `${cor}1A`, color: cor, borderColor: `${cor}55` }}
    >
      {classificacao}
    </span>
  );
}

function RatingButtons({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
  return (
    <div className="rating-btns">
      {ESCALA.map((e) => (
        <button
          type="button"
          key={e.v}
          className={`rating-btn${value === e.v ? " selected" : ""}`}
          style={value === e.v ? { background: e.cor, borderColor: e.cor, color: "#fff" } : {}}
          onClick={() => onChange(e.v)}
          title={e.label}
        >
          {e.v}
        </button>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub }: { icon: any; title: string; sub?: string }) {
  return (
    <div className="empty-state">
      <Icon size={30} strokeWidth={1.5} />
      <p className="empty-title">{title}</p>
      {sub && <p className="empty-sub">{sub}</p>}
    </div>
  );
}

function Select({ value, onChange, options, placeholder, style }: any) {
  return (
    <select className="input select" value={value} onChange={(e) => onChange(e.target.value)} style={style}>
      <option value="">{placeholder}</option>
      {options.map((o: any) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ---------------------------------------------------------------------- */
/* APP PRINCIPAL                                                          */
/* ---------------------------------------------------------------------- */

const emptyCadastros = { professores: [], turmas: [], modalidades: [], avaliadores: [] };

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [cadastros, setCadastros] = useState<any>(emptyCadastros);
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const c = await (window as any).storage?.get("cadastros", false);
        if (c && c.value) setCadastros({ ...emptyCadastros, ...JSON.parse(c.value) });
      } catch (e) {
        /* nada salvo ainda */
      }
      try {
        const a = await (window as any).storage?.get("avaliacoes", false);
        if (a && a.value) setAvaliacoes(JSON.parse(a.value));
      } catch (e) {
        /* nada salvo ainda */
      }
      setLoading(false);
    })();
  }, []);

  function showToast(msg: string, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function persistCadastros(next: any) {
    setCadastros(next);
    try {
      await (window as any).storage?.set("cadastros", JSON.stringify(next), false);
    } catch (e) {
      showToast("Não foi possível salvar o cadastro.", "error");
    }
  }

  async function persistAvaliacoes(next: any) {
    setAvaliacoes(next);
    try {
      await (window as any).storage?.set("avaliacoes", JSON.stringify(next), false);
    } catch (e) {
      showToast("Não foi possível salvar a avaliação.", "error");
    }
  }

  if (loading) {
    return (
      <div className="app-root">
        <div className="loading-screen">Carregando dados…</div>
      </div>
    );
  }

  return (
    <div className="app-root">
      <aside className={`sidebar${mobileNavOpen ? " open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">FR</div>
          <div className="brand-text">
            <strong>Futebol de Rua</strong>
            <span>Avaliação de Professores</span>
          </div>
        </div>
        <nav className="nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`nav-item${tab === n.id ? " active" : ""}`}
              onClick={() => {
                setTab(n.id);
                setMobileNavOpen(false);
              }}
            >
              <n.icon size={18} strokeWidth={2} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <button className="mobile-toggle no-print" onClick={() => setMobileNavOpen((v) => !v)}>
        {mobileNavOpen ? <X size={20} /> : <LayoutDashboard size={20} />}
        <span>{mobileNavOpen ? "Fechar" : "Menu"}</span>
      </button>

      <main className="main">
        {tab === "dashboard" && <Dashboard cadastros={cadastros} avaliacoes={avaliacoes} />}
        {tab === "avaliar" && (
          <NovaAvaliacao
            cadastros={cadastros}
            avaliacoes={avaliacoes}
            persistAvaliacoes={persistAvaliacoes}
            showToast={showToast}
          />
        )}
        {tab === "historico" && (
          <Historico
            cadastros={cadastros}
            avaliacoes={avaliacoes}
            persistAvaliacoes={persistAvaliacoes}
            showToast={showToast}
          />
        )}
        {tab === "professores" && <Professores cadastros={cadastros} avaliacoes={avaliacoes} />}
        {tab === "relatorio" && <RelatorioAnual cadastros={cadastros} avaliacoes={avaliacoes} />}
        {tab === "comparar" && <Comparar cadastros={cadastros} avaliacoes={avaliacoes} />}
        {tab === "cadastros" && (
          <Cadastros cadastros={cadastros} persistCadastros={persistCadastros} avaliacoes={avaliacoes} showToast={showToast} />
        )}
      </main>

      {toast && (
        <div className={`toast toast-${toast.type} no-print`}>
          {toast.type === "error" ? <AlertCircle size={16} /> : <Check size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* PAINEL / DASHBOARD                                                     */
/* ---------------------------------------------------------------------- */

function Dashboard({ cadastros, avaliacoes }: any) {
  const stats = useMemo(() => {
    const calcs = avaliacoes.map((a: any) => ({ a, c: calcAvaliacao(a.criterios) }));
    const totalProfessores = cadastros.professores.length;
    const totalAvaliacoes = avaliacoes.length;
    const mediaGeral = calcs.length ? calcs.reduce((s: number, x: any) => s + x.c.media, 0) / calcs.length : 0;
    const percentualMedio = (mediaGeral / 5) * 100;

    const distribuicao = ESCALA.map((e) => ({
      label: e.label,
      cor: e.cor,
      qtd: calcs.filter((x: any) => x.c.classificacao === e.label).length,
    }));

    const porMes: Record<string, number[]> = {};
    calcs.forEach(({ a, c }: any) => {
      const mes = (a.data || "").slice(0, 7);
      if (!mes) return;
      if (!porMes[mes]) porMes[mes] = [];
      porMes[mes].push(c.media);
    });
    const evolucao = Object.keys(porMes)
      .sort()
      .map((mes) => ({
        mes,
        media: porMes[mes].reduce((s, v) => s + v, 0) / porMes[mes].length,
      }));

    const porModalidade: Record<string, number[]> = {};
    calcs.forEach(({ a, c }: any) => {
      const mod = a.modalidade || "Não informado";
      if (!porModalidade[mod]) porModalidade[mod] = [];
      porModalidade[mod].push(c.media);
    });
    const mediaPorModalidade = Object.keys(porModalidade).map((mod) => ({
      nome: mod,
      media: porModalidade[mod].reduce((s, v) => s + v, 0) / porModalidade[mod].length,
    }));

    const porProfessor: Record<string, number[]> = {};
    calcs.forEach(({ a, c }: any) => {
      const nome = a.professorNome || "—";
      if (!porProfessor[nome]) porProfessor[nome] = [];
      porProfessor[nome].push(c.media);
    });
    const mediaPorProfessor = Object.keys(porProfessor)
      .map((nome) => ({
        nome,
        media: porProfessor[nome].reduce((s, v) => s + v, 0) / porProfessor[nome].length,
      }))
      .sort((a, b) => b.media - a.media);

    return { totalProfessores, totalAvaliacoes, mediaGeral, percentualMedio, distribuicao, evolucao, mediaPorModalidade, mediaPorProfessor };
  }, [cadastros, avaliacoes]);

  function exportarResumo() {
    if (!stats.mediaPorProfessor.length) return;
    let csv = "Professor;Media;Classificacao\n";
    stats.mediaPorProfessor.forEach((p) => {
      csv += `"${p.nome}";"${mediaFmt(p.media)}";"${classify(p.media)}"\n`;
    });
    downloadCSV("resumo_desempenho_equipe.csv", csv);
  }

  return (
    <div>
      <PageHeader
        title="Painel da Coordenação"
        sub="Visão geral do desempenho dos professores no Projeto Jovem Aprendiz"
        right={
          avaliacoes.length > 0 && (
            <button className="btn btn-secondary no-print" onClick={exportarResumo}>
              <Download size={16} /> Exportar Resumo CSV
            </button>
          )
        }
      />

      <div className="kpi-grid">
        <KpiCard label="Professores cadastrados" value={stats.totalProfessores} />
        <KpiCard label="Avaliações registradas" value={stats.totalAvaliacoes} />
        <KpiCard label="Média geral da equipe" value={`${mediaFmt(stats.mediaGeral)} / 5`} />
        <KpiCard label="Percentual médio" value={pctFmt(stats.percentualMedio)} />
      </div>

      {avaliacoes.length === 0 ? (
        <div className="card" style={{ marginTop: 20 }}>
          <EmptyState
            icon={ClipboardCheck}
            title="Nenhuma avaliação registrada ainda"
            sub="Cadastre professores em Cadastros e registre a primeira avaliação em Nova Avaliação."
          />
        </div>
      ) : (
        <div className="grid-2" style={{ marginTop: 20 }}>
          <div className="card">
            <h3 className="card-title">Distribuição por classificação</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.distribuicao}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E1D2" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#55605A" }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#55605A" }} />
                <Tooltip />
                <Bar dataKey="qtd" radius={[6, 6, 0, 0]}>
                  {stats.distribuicao.map((d, i) => (
                    <Cell key={i} fill={d.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="card-title">Evolução média da equipe</h3>
            {stats.evolucao.length > 1 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats.evolucao}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E1D2" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#55605A" }} />
                  <YAxis domain={[1, 5]} tick={{ fontSize: 11, fill: "#55605A" }} />
                  <Tooltip formatter={(v: any) => mediaFmt(v)} />
                  <Line type="monotone" dataKey="media" stroke="#1E6B43" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={History} title="Dados insuficientes" sub="Registre avaliações em mais de um mês para ver a evolução." />
            )}
          </div>

          <div className="card">
            <h3 className="card-title">Média por modalidade</h3>
            <ResponsiveContainer width="100%" height={Math.max(160, stats.mediaPorModalidade.length * 42)}>
              <BarChart data={stats.mediaPorModalidade} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E1D2" horizontal={false} />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: "#55605A" }} />
                <YAxis type="category" dataKey="nome" width={110} tick={{ fontSize: 11, fill: "#55605A" }} />
                <Tooltip formatter={(v: any) => mediaFmt(v)} />
                <Bar dataKey="media" fill="#E2A33B" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="card-title">Média por professor</h3>
            <ResponsiveContainer width="100%" height={Math.max(160, stats.mediaPorProfessor.length * 34)}>
              <BarChart data={stats.mediaPorProfessor} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E1D2" horizontal={false} />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: "#55605A" }} />
                <YAxis type="category" dataKey="nome" width={120} tick={{ fontSize: 11, fill: "#55605A" }} />
                <Tooltip formatter={(v: any) => mediaFmt(v)} />
                <Bar dataKey="media" radius={[0, 6, 6, 0]}>
                  {stats.mediaPorProfessor.map((d, i) => (
                    <Cell key={i} fill={corClassificacao(classify(d.media))} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="kpi-card">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
    </div>
  );
}

function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: any }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* NOVA AVALIAÇÃO                                                         */
/* ---------------------------------------------------------------------- */

function NovaAvaliacao({ cadastros, avaliacoes, persistAvaliacoes, showToast }: any) {
  const blank = {
    professorId: "",
    modalidade: "",
    turma: "",
    avaliador: "",
    data: new Date().toISOString().slice(0, 10),
    criterios: {},
    avaliacaoGeral: "",
    observacoes: "",
  };
  const [form, setForm] = useState(blank);
  const [tentouSalvar, setTentouSalvar] = useState(false);

  const computed = useMemo(() => calcAvaliacao(form.criterios), [form.criterios]);

  function setCriterio(id: string, val: number) {
    setForm((f) => ({ ...f, criterios: { ...f.criterios, [id]: val } }));
  }

  function selecionarProfessor(id: string) {
    const prof = cadastros.professores.find((p: any) => p.id === id);
    setForm((f) => ({ ...f, professorId: id, modalidade: prof ? prof.modalidade : f.modalidade }));
  }

  const camposBasicosOk = form.professorId && form.modalidade && form.turma && form.avaliador && form.data;
  const podeSalvar = camposBasicosOk && computed.completo && form.avaliacaoGeral;

  async function salvar() {
    setTentouSalvar(true);
    if (!podeSalvar) {
      showToast("Preencha todos os campos e os 16 critérios antes de salvar.", "error");
      return;
    }
    const prof = cadastros.professores.find((p: any) => p.id === form.professorId);
    const novo = {
      id: uid(),
      professorId: form.professorId,
      professorNome: prof ? prof.nome : "",
      modalidade: form.modalidade,
      turma: form.turma,
      avaliador: form.avaliador,
      data: form.data,
      criterios: form.criterios,
      avaliacaoGeral: form.avaliacaoGeral,
      observacoes: form.observacoes,
      createdAt: Date.now(),
    };
    await persistAvaliacoes([...avaliacoes, novo]);
    showToast(`Avaliação de ${novo.professorNome} salva com sucesso.`);
    setForm(blank);
    setTentouSalvar(false);
  }

  const semCadastros = cadastros.professores.length === 0 || cadastros.modalidades.length === 0 || cadastros.turmas.length === 0 || cadastros.avaliadores.length === 0;

  return (
    <div>
      <PageHeader title="Nova Avaliação" sub="Preencha os 16 critérios observados durante o treino." />

      {semCadastros && (
        <div className="warning-banner">
          <AlertCircle size={16} />
          Cadastre ao menos um professor, uma modalidade, uma turma e um avaliador na página <strong>Cadastros</strong> antes de iniciar.
        </div>
      )}

      <div className="avaliacao-layout">
        <div>
          <div className="card">
            <h3 className="card-title">Identificação</h3>
            <div className="form-grid">
              <Field label="Professor" required>
                <Select
                  value={form.professorId}
                  onChange={selecionarProfessor}
                  placeholder="Selecione o professor"
                  options={cadastros.professores.filter((p: any) => p.status !== "Inativo").map((p: any) => ({ value: p.id, label: p.nome }))}
                />
              </Field>
              <Field label="Modalidade" required>
                <Select
                  value={form.modalidade}
                  onChange={(v: string) => setForm((f) => ({ ...f, modalidade: v }))}
                  placeholder="Selecione a modalidade"
                  options={cadastros.modalidades.map((m: any) => ({ value: m.nome, label: m.nome }))}
                />
              </Field>
              <Field label="Turma" required>
                <Select
                  value={form.turma}
                  onChange={(v: string) => setForm((f) => ({ ...f, turma: v }))}
                  placeholder="Selecione a turma"
                  options={cadastros.turmas.map((t: any) => ({ value: t.nome, label: t.nome }))}
                />
              </Field>
              <Field label="Avaliador" required>
                <Select
                  value={form.avaliador}
                  onChange={(v: string) => setForm((f) => ({ ...f, avaliador: v }))}
                  placeholder="Selecione o avaliador"
                  options={cadastros.avaliadores.map((a: any) => ({ value: a.nome, label: `${a.nome} — ${a.funcao}` }))}
                />
              </Field>
              <Field label="Data da observação" required>
                <input
                  type="date"
                  className="input"
                  value={form.data}
                  onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                />
              </Field>
            </div>
          </div>

          <div className="legend-row">
            {ESCALA.map((e) => (
              <span key={e.v} className="legend-chip">
                <span className="legend-dot" style={{ background: e.cor }} />
                {e.v} · {e.label}
              </span>
            ))}
          </div>

          {AREAS.map((area) => (
            <div className="card area-card" key={area.id}>
              <div className="area-card-head">
                <h3 className="card-title">{area.nome}</h3>
                <span className="area-media" style={{ color: corClassificacao(classify(computed.areaMedia[area.id])) }}>
                  {computed.areaMedia[area.id] ? mediaFmt(computed.areaMedia[area.id]) : "—"}
                </span>
              </div>
              {area.criterios.map((c) => (
                <div className="criterio-row" key={c.id}>
                  <div className="criterio-texto">
                    <span>{c.label}</span>
                    {tentouSalvar && (form.criterios as any)[c.id] === undefined && <span className="criterio-alerta">obrigatório</span>}
                  </div>
                  <RatingButtons value={(form.criterios as any)[c.id]} onChange={(v) => setCriterio(c.id, v)} />
                </div>
              ))}
            </div>
          ))}

          <div className="card">
            <h3 className="card-title">Avaliação geral do avaliador</h3>
            <p className="field-hint">Percepção geral, independente do cálculo automático dos critérios.</p>
            <div className="chip-group">
              {ESCALA.map((e) => (
                <button
                  type="button"
                  key={e.label}
                  className={`chip${form.avaliacaoGeral === e.label ? " chip-selected" : ""}`}
                  style={form.avaliacaoGeral === e.label ? { background: e.cor, borderColor: e.cor, color: "#fff" } : {}}
                  onClick={() => setForm((f) => ({ ...f, avaliacaoGeral: e.label }))}
                >
                  {e.label}
                </button>
              ))}
            </div>

            <Field label="Observações gerais" style={{ marginTop: 16 }}>
              <textarea
                className="input textarea"
                rows={5}
                placeholder="Situações observadas, pontos positivos, dificuldades, comportamentos, sugestões e pontos a desenvolver…"
                value={form.observacoes}
                onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
              />
            </Field>
          </div>
        </div>

        <div className="avaliacao-resumo no-print">
          <div className="resumo-media">
            <span className="resumo-label">Média em tempo real</span>
            <span className="resumo-valor" style={{ color: corClassificacao(computed.classificacao) }}>
              {mediaFmt(computed.media)}
            </span>
            <Badge classificacao={computed.classificacao} />
            <span className="resumo-progresso">{computed.preenchidos} de 16 critérios preenchidos</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(computed.preenchidos / 16) * 100}%` }} />
            </div>
          </div>
          <div className="resumo-areas">
            {AREAS.map((a) => (
              <div className="resumo-area-item" key={a.id}>
                <span>{a.nome}</span>
                <strong style={{ color: corClassificacao(classify(computed.areaMedia[a.id])) }}>
                  {computed.areaMedia[a.id] ? mediaFmt(computed.areaMedia[a.id]) : "—"}
                </strong>
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-block" onClick={salvar}>
            <Check size={16} /> Salvar avaliação
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children, style }: any) {
  return (
    <label className="field" style={style}>
      <span className="field-label">
        {label} {required && <span className="required">*</span>}
      </span>
      {children}
    </label>
  );
}

/* ---------------------------------------------------------------------- */
/* HISTÓRICO                                                              */
/* ---------------------------------------------------------------------- */

function Historico({ cadastros, avaliacoes, persistAvaliacoes, showToast }: any) {
  const [filtros, setFiltros] = useState({
    professorId: "", modalidade: "", turma: "", avaliador: "", classificacao: "", dataIni: "", dataFim: "",
  });
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const [excluirId, setExcluirId] = useState<string | null>(null);

  const linhas = useMemo(() => {
    return avaliacoes
      .map((a: any) => ({ a, c: calcAvaliacao(a.criterios) }))
      .filter(({ a, c }: any) => {
        if (filtros.professorId && a.professorId !== filtros.professorId) return false;
        if (filtros.modalidade && a.modalidade !== filtros.modalidade) return false;
        if (filtros.turma && a.turma !== filtros.turma) return false;
        if (filtros.avaliador && a.avaliador !== filtros.avaliador) return false;
        if (filtros.classificacao && c.classificacao !== filtros.classificacao) return false;
        if (filtros.dataIni && a.data < filtros.dataIni) return false;
        if (filtros.dataFim && a.data > filtros.dataFim) return false;
        return true;
      })
      .sort((x: any, y: any) => (y.a.data || "").localeCompare(x.a.data || ""));
  }, [avaliacoes, filtros]);

  const detalhe = detalheId ? avaliacoes.find((a: any) => a.id === detalheId) : null;
  const detalheCalc = detalhe ? calcAvaliacao(detalhe.criterios) : null;

  function limparFiltros() {
    setFiltros({ professorId: "", modalidade: "", turma: "", avaliador: "", classificacao: "", dataIni: "", dataFim: "" });
  }

  async function deletarAvaliacao() {
    if (!excluirId) return;
    const proxima = avaliacoes.filter((a: any) => a.id !== excluirId);
    await persistAvaliacoes(proxima);
    showToast("Avaliação excluída com sucesso.");
    setExcluirId(null);
    if (detalheId === excluirId) setDetalheId(null);
  }

  function exportarHistoricoCSV() {
    if (!linhas.length) return;
    let csv = "Data;Professor;Modalidade;Turma;Avaliador;Media;Percentual;Classificacao;Observacoes\n";
    linhas.forEach(({ a, c }: any) => {
      const obs = (a.observacoes || "").replace(/"/g, '""').replace(/\n/g, " ");
      csv += `"${formatDateBR(a.data)}";"${a.professorNome}";"${a.modalidade}";"${a.turma}";"${a.avaliador}";"${mediaFmt(c.media)}";"${pctFmt(c.percentual)}";"${c.classificacao}";"${obs}"\n`;
    });
    downloadCSV("historico_avaliacoes.csv", csv);
  }

  return (
    <div>
      <PageHeader
        title="Histórico de Avaliações"
        sub={`${linhas.length} avaliação(ões) encontrada(s)`}
        right={
          linhas.length > 0 && (
            <button className="btn btn-secondary no-print" onClick={exportarHistoricoCSV}>
              <Download size={16} /> Exportar CSV
            </button>
          )
        }
      />

      <div className="card filters-bar">
        <Select value={filtros.professorId} onChange={(v: string) => setFiltros((f) => ({ ...f, professorId: v }))} placeholder="Todos os professores" options={cadastros.professores.map((p: any) => ({ value: p.id, label: p.nome }))} />
        <Select value={filtros.modalidade} onChange={(v: string) => setFiltros((f) => ({ ...f, modalidade: v }))} placeholder="Todas as modalidades" options={cadastros.modalidades.map((m: any) => ({ value: m.nome, label: m.nome }))} />
        <Select value={filtros.turma} onChange={(v: string) => setFiltros((f) => ({ ...f, turma: v }))} placeholder="Todas as turmas" options={cadastros.turmas.map((t: any) => ({ value: t.nome, label: t.nome }))} />
        <Select value={filtros.avaliador} onChange={(v: string) => setFiltros((f) => ({ ...f, avaliador: v }))} placeholder="Todos os avaliadores" options={cadastros.avaliadores.map((a: any) => ({ value: a.nome, label: a.nome }))} />
        <Select value={filtros.classificacao} onChange={(v: string) => setFiltros((f) => ({ ...f, classificacao: v }))} placeholder="Todas as classificações" options={ESCALA.map((e) => ({ value: e.label, label: e.label }))} />
        <input type="date" className="input" value={filtros.dataIni} onChange={(e) => setFiltros((f) => ({ ...f, dataIni: e.target.value }))} />
        <input type="date" className="input" value={filtros.dataFim} onChange={(e) => setFiltros((f) => ({ ...f, dataFim: e.target.value }))} />
        <button className="btn btn-secondary" onClick={limparFiltros}>
          <RotateCcw size={14} /> Limpar
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {linhas.length === 0 ? (
          <div style={{ padding: 24 }}>
            <EmptyState icon={Search} title="Nenhuma avaliação encontrada" sub="Ajuste os filtros ou registre uma nova avaliação." />
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Professor</th>
                <th>Modalidade</th>
                <th>Turma</th>
                <th>Avaliador</th>
                <th>Média</th>
                <th>Percentual</th>
                <th>Classificação</th>
                <th className="no-print">Ações</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map(({ a, c }: any) => (
                <tr key={a.id} className="table-row-click" onClick={() => setDetalheId(a.id)}>
                  <td>{formatDateBR(a.data)}</td>
                  <td>{a.professorNome}</td>
                  <td>{a.modalidade}</td>
                  <td>{a.turma}</td>
                  <td>{a.avaliador}</td>
                  <td>{mediaFmt(c.media)}</td>
                  <td>{pctFmt(c.percentual)}</td>
                  <td>
                    <Badge classificacao={c.classificacao} size="sm" />
                  </td>
                  <td className="no-print" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="icon-btn"
                      title="Excluir avaliação"
                      onClick={() => setExcluirId(a.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detalhe && detalheCalc && (
        <div className="modal-overlay" onClick={() => setDetalheId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h2>{detalhe.professorNome}</h2>
                <p className="page-sub">
                  {formatDateBR(detalhe.data)} · {detalhe.modalidade} · Turma {detalhe.turma} · Avaliador: {detalhe.avaliador}
                </p>
              </div>
              <button className="icon-btn" onClick={() => setDetalheId(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-kpis">
              <div>
                <span>Média</span>
                <strong style={{ color: corClassificacao(detalheCalc.classificacao) }}>{mediaFmt(detalheCalc.media)}</strong>
              </div>
              <div>
                <span>Percentual</span>
                <strong>{pctFmt(detalheCalc.percentual)}</strong>
              </div>
              <div>
                <span>Classificação</span>
                <Badge classificacao={detalheCalc.classificacao} />
              </div>
              <div>
                <span>Avaliação geral</span>
                <strong>{detalhe.avaliacaoGeral || "—"}</strong>
              </div>
            </div>

            {AREAS.map((area) => (
              <div key={area.id} className="modal-area">
                <div className="area-card-head">
                  <h4>{area.nome}</h4>
                  <span style={{ color: corClassificacao(classify(detalheCalc.areaMedia[area.id])) }}>{mediaFmt(detalheCalc.areaMedia[area.id])}</span>
                </div>
                {area.criterios.map((c) => (
                  <div className="modal-criterio" key={c.id}>
                    <span>{c.label}</span>
                    <strong style={{ color: corClassificacao(ESCALA.find((e) => e.v === detalhe.criterios[c.id])?.label || "") }}>
                      {detalhe.criterios[c.id]}
                    </strong>
                  </div>
                ))}
              </div>
            ))}

            <div className="modal-area">
              <h4>Observações gerais</h4>
              <p className="observacoes-texto">{detalhe.observacoes || "Nenhuma observação registrada."}</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {excluirId && (
        <div className="modal-overlay" onClick={() => setExcluirId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-head" style={{ marginBottom: 12 }}>
              <h2 style={{ color: "#C1443C" }}>Confirmar Exclusão</h2>
              <button className="icon-btn" onClick={() => setExcluirId(null)}>
                <X size={18} />
              </button>
            </div>
            <p className="observacoes-texto" style={{ marginBottom: 20 }}>
              Tem certeza de que deseja apagar esta avaliação? Esta ação é irreversível e removerá todos os registros associados.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setExcluirId(null)}>
                Cancelar
              </button>
              <button className="btn" style={{ background: "#C1443C", color: "#fff" }} onClick={deletarAvaliacao}>
                Sim, apagar avaliação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* PERFIL DO PROFESSOR                                                    */
/* ---------------------------------------------------------------------- */

function statsProfessor(professorId: string, avaliacoes: any[]) {
  const lista = avaliacoes
    .filter((a) => a.professorId === professorId)
    .map((a) => ({ a, c: calcAvaliacao(a.criterios) }))
    .sort((x, y) => (x.a.data || "").localeCompare(y.a.data || ""));

  const qtd = lista.length;
  const mediaGeral = qtd ? lista.reduce((s, x) => s + x.c.media, 0) / qtd : 0;
  const percentualMedio = (mediaGeral / 5) * 100;
  const areaMedia: Record<string, number> = {};
  AREAS.forEach((area) => {
    areaMedia[area.id] = qtd ? lista.reduce((s, x) => s + x.c.areaMedia[area.id], 0) / qtd : 0;
  });
  return { lista, qtd, mediaGeral, percentualMedio, areaMedia, classificacao: classify(mediaGeral) };
}

function Professores({ cadastros, avaliacoes }: any) {
  const [profId, setProfId] = useState(cadastros.professores[0]?.id || "");
  const prof = cadastros.professores.find((p: any) => p.id === profId);
  const stats = useMemo(() => (profId ? statsProfessor(profId, avaliacoes) : null), [profId, avaliacoes]);

  useEffect(() => {
    if (!profId && cadastros.professores.length) setProfId(cadastros.professores[0].id);
  }, [cadastros.professores, profId]);

  function exportarProfessorCSV() {
    if (!stats || !stats.lista.length || !prof) return;
    let csv = `Data;Turma;Avaliador;Media;Classificacao\n`;
    stats.lista.forEach(({ a, c }: any) => {
      csv += `"${formatDateBR(a.data)}";"${a.turma}";"${a.avaliador}";"${mediaFmt(c.media)}";"${c.classificacao}"\n`;
    });
    downloadCSV(`historico_${prof.nome.toLowerCase().replace(/\s+/g, "_")}.csv`, csv);
  }

  return (
    <div>
      <PageHeader
        title="Perfil do Professor"
        sub="Histórico individual e evolução ao longo do tempo"
        right={
          stats && stats.lista.length > 0 && (
            <button className="btn btn-secondary no-print" onClick={exportarProfessorCSV}>
              <Download size={16} /> Exportar CSV
            </button>
          )
        }
      />

      {cadastros.professores.length === 0 ? (
        <div className="card">
          <EmptyState icon={Users} title="Nenhum professor cadastrado" sub="Cadastre professores na página Cadastros." />
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <Field label="Professor">
              <Select value={profId} onChange={setProfId} placeholder="Selecione um professor" options={cadastros.professores.map((p: any) => ({ value: p.id, label: p.nome }))} />
            </Field>
          </div>

          {prof && stats && (
            <>
              <div className="profile-head card">
                <div className="profile-avatar">
                  <UserCircle2 size={40} strokeWidth={1.4} />
                </div>
                <div className="profile-info">
                  <h2>{prof.nome}</h2>
                  <p className="page-sub">
                    {prof.modalidade} · {prof.status === "Inativo" ? "Inativo" : "Ativo"}
                  </p>
                </div>
                <Badge classificacao={stats.classificacao} />
              </div>

              <div className="kpi-grid" style={{ marginTop: 16 }}>
                <KpiCard label="Avaliações realizadas" value={stats.qtd} />
                <KpiCard label="Média geral" value={mediaFmt(stats.mediaGeral)} />
                <KpiCard label="Percentual médio" value={pctFmt(stats.percentualMedio)} />
                <KpiCard label="Classificação atual" value={stats.classificacao} />
              </div>

              <div className="card" style={{ marginTop: 20 }}>
                <h3 className="card-title">Médias por área</h3>
                <div className="area-medias-grid">
                  {AREAS.map((a) => (
                    <div key={a.id} className="area-media-card">
                      <span>{a.nome}</span>
                      <strong style={{ color: corClassificacao(classify(stats.areaMedia[a.id])) }}>{mediaFmt(stats.areaMedia[a.id])}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ marginTop: 20 }}>
                <h3 className="card-title">Evolução ao longo do tempo</h3>
                {stats.lista.length > 1 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={stats.lista.map(({ a, c }) => ({ data: formatDateBR(a.data), media: c.media }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E7E1D2" vertical={false} />
                      <XAxis dataKey="data" tick={{ fontSize: 11, fill: "#55605A" }} />
                      <YAxis domain={[1, 5]} tick={{ fontSize: 11, fill: "#55605A" }} />
                      <Tooltip formatter={(v: any) => mediaFmt(v)} />
                      <Line type="monotone" dataKey="media" stroke="#1E6B43" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon={History} title="Ainda sem evolução" sub="Registre mais avaliações para este professor." />
                )}
              </div>

              <div className="card" style={{ marginTop: 20, padding: 0 }}>
                <h3 className="card-title" style={{ padding: "20px 20px 0" }}>
                  Avaliações registradas
                </h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Turma</th>
                      <th>Avaliador</th>
                      <th>Média</th>
                      <th>Classificação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.lista
                      .slice()
                      .reverse()
                      .map(({ a, c }: any) => (
                        <tr key={a.id}>
                          <td>{formatDateBR(a.data)}</td>
                          <td>{a.turma}</td>
                          <td>{a.avaliador}</td>
                          <td>{mediaFmt(c.media)}</td>
                          <td>
                            <Badge classificacao={c.classificacao} size="sm" />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* RELATÓRIO ANUAL                                                        */
/* ---------------------------------------------------------------------- */

function RelatorioAnual({ cadastros, avaliacoes }: any) {
  const [profId, setProfId] = useState("");
  const [ano, setAno] = useState("");

  const avaliacoesDoProf = avaliacoes.filter((a: any) => a.professorId === profId);
  const anosDisponiveis = [...new Set(avaliacoesDoProf.map((a: any) => (a.data || "").slice(0, 4)))].sort();

  useEffect(() => {
    if (profId && !ano && anosDisponiveis.length) setAno(anosDisponiveis[anosDisponiveis.length - 1]);
  }, [profId, anosDisponiveis, ano]);

  const prof = cadastros.professores.find((p: any) => p.id === profId);

  const relatorio = useMemo(() => {
    if (!profId || !ano) return null;
    const lista = avaliacoesDoProf
      .filter((a: any) => (a.data || "").startsWith(ano))
      .map((a: any) => ({ a, c: calcAvaliacao(a.criterios) }))
      .sort((x: any, y: any) => (x.a.data || "").localeCompare(y.a.data || ""));
    if (!lista.length) return { lista: [] };

    const qtd = lista.length;
    const mediaAnual = lista.reduce((s: number, x: any) => s + x.c.media, 0) / qtd;
    const percentualAnual = (mediaAnual / 5) * 100;
    const areaMedia: Record<string, number> = {};
    AREAS.forEach((area) => {
      areaMedia[area.id] = lista.reduce((s: number, x: any) => s + x.c.areaMedia[area.id], 0) / qtd;
    });
    const melhor = lista.reduce((m: any, x: any) => (x.c.media > m.c.media ? x : m), lista[0]);
    const menor = lista.reduce((m: any, x: any) => (x.c.media < m.c.media ? x : m), lista[0]);

    const areasOrdenadas = AREAS.map((a) => ({ id: a.id, nome: a.nome, media: areaMedia[a.id] })).sort((a, b) => b.media - a.media);
    const pontosFortes = areasOrdenadas.slice(0, 2);
    const pontosAtencao = areasOrdenadas.slice(-2).reverse();

    const observacoes = lista.filter((x: any) => x.a.observacoes && x.a.observacoes.trim()).map((x: any) => ({ data: x.a.data, texto: x.a.observacoes }));

    return {
      lista,
      qtd,
      mediaAnual,
      percentualAnual,
      areaMedia,
      classificacao: classify(mediaAnual),
      melhor,
      menor,
      pontosFortes,
      pontosAtencao,
      observacoes,
    };
  }, [profId, ano, avaliacoesDoProf]);

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title="Relatório Anual Individual"
          sub="Selecione um professor e o ano para gerar o relatório"
          right={
            relatorio && relatorio.lista && relatorio.lista.length > 0 ? (
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={16} /> Imprimir / PDF
              </button>
            ) : null
          }
        />

        <div className="card filters-bar">
          <Select
            value={profId}
            onChange={(v: string) => {
              setProfId(v);
              setAno("");
            }}
            placeholder="Selecione o professor"
            options={cadastros.professores.map((p: any) => ({ value: p.id, label: p.nome }))}
          />
          <Select value={ano} onChange={setAno} placeholder="Selecione o ano" options={anosDisponiveis.map((a: any) => ({ value: a, label: a }))} />
        </div>
      </div>

      {!profId && (
        <div className="card">
          <EmptyState icon={FileText} title="Selecione um professor" sub="Escolha um professor e um ano para gerar o relatório anual." />
        </div>
      )}

      {profId && relatorio && relatorio.lista.length === 0 && (
        <div className="card">
          <EmptyState icon={FileText} title="Sem avaliações no período" sub="Esse professor não possui avaliações no ano selecionado." />
        </div>
      )}

      {prof && relatorio && relatorio.lista.length > 0 && (
        <div className="relatorio-folha card">
          <div className="relatorio-cabecalho">
            <div>
              <span className="relatorio-eyebrow">Relatório Anual Individual · {ano}</span>
              <h2>{prof.nome}</h2>
              <p className="page-sub">{prof.modalidade}</p>
            </div>
            <Badge classificacao={relatorio.classificacao} />
          </div>

          <div className="kpi-grid">
            <KpiCard label="Avaliações no ano" value={relatorio.qtd} />
            <KpiCard label="Média anual" value={mediaFmt(relatorio.mediaAnual)} />
            <KpiCard label="Percentual anual" value={pctFmt(relatorio.percentualAnual)} />
            <KpiCard label="Classificação final" value={relatorio.classificacao} />
          </div>

          <h3 className="card-title" style={{ marginTop: 20 }}>Médias por área</h3>
          <div className="area-medias-grid">
            {AREAS.map((a) => (
              <div key={a.id} className="area-media-card">
                <span>{a.nome}</span>
                <strong style={{ color: corClassificacao(classify(relatorio.areaMedia[a.id])) }}>{mediaFmt(relatorio.areaMedia[a.id])}</strong>
              </div>
            ))}
          </div>

          <h3 className="card-title" style={{ marginTop: 20 }}>Evolução durante o ano</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={relatorio.lista.map(({ a, c }: any) => ({ data: formatDateBR(a.data), media: c.media }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E1D2" vertical={false} />
              <XAxis dataKey="data" tick={{ fontSize: 11, fill: "#55605A" }} />
              <YAxis domain={[1, 5]} tick={{ fontSize: 11, fill: "#55605A" }} />
              <Tooltip formatter={(v: any) => mediaFmt(v)} />
              <Line type="monotone" dataKey="media" stroke="#1E6B43" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>

          <div className="grid-2" style={{ marginTop: 20 }}>
            <div className="destaque-box destaque-boa">
              <span>Melhor avaliação</span>
              <strong>{formatDateBR(relatorio.melhor.a.data)} — {mediaFmt(relatorio.melhor.c.media)}</strong>
              <p>{relatorio.melhor.a.turma} · {relatorio.melhor.a.avaliador}</p>
            </div>
            <div className="destaque-box destaque-ruim">
              <span>Menor avaliação</span>
              <strong>{formatDateBR(relatorio.menor.a.data)} — {mediaFmt(relatorio.menor.c.media)}</strong>
              <p>{relatorio.menor.a.turma} · {relatorio.menor.a.avaliador}</p>
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: 20 }}>
            <div>
              <h3 className="card-title">Pontos fortes identificados</h3>
              <ul className="pontos-lista pontos-fortes">
                {relatorio.pontosFortes.map((p: any) => (
                  <li key={p.id}>
                    {p.nome} <strong>{mediaFmt(p.media)}</strong>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="card-title">Pontos de atenção</h3>
              <ul className="pontos-lista pontos-atencao">
                {relatorio.pontosAtencao.map((p: any) => (
                  <li key={p.id}>
                    {p.nome} <strong>{mediaFmt(p.media)}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <h3 className="card-title" style={{ marginTop: 20 }}>Observações registradas durante o ano</h3>
          {relatorio.observacoes.length === 0 ? (
            <p className="field-hint">Nenhuma observação registrada neste ano.</p>
          ) : (
            <div className="observacoes-lista">
              {relatorio.observacoes.map((o: any, i: number) => (
                <div key={i} className="observacao-item">
                  <span>{formatDateBR(o.data)}</span>
                  <p>{o.texto}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* COMPARAÇÃO                                                             */
/* ---------------------------------------------------------------------- */

function Comparar({ cadastros, avaliacoes }: any) {
  const [selecionados, setSelecionados] = useState<string[]>([]);

  function toggle(id: string) {
    setSelecionados((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 5 ? [...s, id] : s));
  }

  const dados = selecionados.map((id) => ({
    prof: cadastros.professores.find((p: any) => p.id === id),
    stats: statsProfessor(id, avaliacoes),
  }));

  const CORES = ["#1E6B43", "#E2A33B", "#2B6CB0", "#8E4EC6", "#C1443C"];

  const evolucaoData = useMemo(() => {
    const maxLen = Math.max(0, ...dados.map((d) => d.stats.lista.length));
    const rows = [];
    for (let i = 0; i < maxLen; i++) {
      const row: any = { avaliacao: `${i + 1}ª` };
      dados.forEach((d) => {
        if (d.stats.lista[i]) row[d.prof.nome] = d.stats.lista[i].c.media;
      });
      rows.push(row);
    }
    return rows;
  }, [dados]);

  return (
    <div>
      <PageHeader title="Comparação entre Professores" sub="Selecione dois ou mais professores para identificar pontos de desenvolvimento" />

      <div className="card">
        <h3 className="card-title">Professores</h3>
        <div className="chip-group">
          {cadastros.professores.map((p: any) => (
            <button key={p.id} className={`chip${selecionados.includes(p.id) ? " chip-selected" : ""}`} onClick={() => toggle(p.id)}>
              {p.nome}
            </button>
          ))}
        </div>
      </div>

      {selecionados.length < 2 ? (
        <div className="card" style={{ marginTop: 20 }}>
          <EmptyState icon={GitCompare} title="Selecione ao menos dois professores" sub="A comparação ajuda a identificar pontos de desenvolvimento, não é um ranking." />
        </div>
      ) : (
        <>
          <div className="card" style={{ marginTop: 20, padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Indicador</th>
                  {dados.map((d, i) => (
                    <th key={d.prof.id} style={{ color: CORES[i] }}>
                      {d.prof.nome}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Média geral</strong></td>
                  {dados.map((d) => (
                    <td key={d.prof.id}>{mediaFmt(d.stats.mediaGeral)}</td>
                  ))}
                </tr>
                {AREAS.map((a) => (
                  <tr key={a.id}>
                    <td>{a.nome}</td>
                    {dados.map((d) => (
                      <td key={d.prof.id}>{mediaFmt(d.stats.areaMedia[a.id])}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td><strong>Classificação</strong></td>
                  {dados.map((d) => (
                    <td key={d.prof.id}>
                      <Badge classificacao={d.stats.classificacao} size="sm" />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="card" style={{ marginTop: 20 }}>
            <h3 className="card-title">Evolução ao longo do tempo</h3>
            {evolucaoData.length > 1 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={evolucaoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E1D2" vertical={false} />
                  <XAxis dataKey="avaliacao" tick={{ fontSize: 11, fill: "#55605A" }} />
                  <YAxis domain={[1, 5]} tick={{ fontSize: 11, fill: "#55605A" }} />
                  <Tooltip formatter={(v: any) => mediaFmt(v)} />
                  <Legend />
                  {dados.map((d, i) => (
                    <Line key={d.prof.id} type="monotone" dataKey={d.prof.nome} stroke={CORES[i]} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={History} title="Dados insuficientes" sub="Registre mais avaliações para comparar a evolução." />
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* CADASTROS                                                              */
/* ---------------------------------------------------------------------- */

function Cadastros({ cadastros, persistCadastros, avaliacoes, showToast }: any) {
  const [secao, setSecao] = useState("professores");

  const professorTemAvaliacao = (id: string) => avaliacoes.some((a: any) => a.professorId === id);

  async function addProfessor(nome: string, modalidade: string) {
    if (!nome || !modalidade) return showToast("Informe nome e modalidade.", "error");
    const next = { ...cadastros, professores: [...cadastros.professores, { id: uid(), nome, modalidade, status: "Ativo" }] };
    await persistCadastros(next);
    showToast("Professor cadastrado.");
  }
  async function toggleProfessorStatus(id: string) {
    const next = { ...cadastros, professores: cadastros.professores.map((p: any) => (p.id === id ? { ...p, status: p.status === "Inativo" ? "Ativo" : "Inativo" } : p)) };
    await persistCadastros(next);
  }
  async function removeProfessor(id: string) {
    if (professorTemAvaliacao(id)) return showToast("Este professor possui avaliações e não pode ser excluído. Torne-o inativo.", "error");
    const next = { ...cadastros, professores: cadastros.professores.filter((p: any) => p.id !== id) };
    await persistCadastros(next);
  }

  async function addTurma(nome: string, qtd: number) {
    if (!nome) return showToast("Informe o nome da turma.", "error");
    const next = { ...cadastros, turmas: [...cadastros.turmas, { id: uid(), nome, qtd: qtd || 0 }] };
    await persistCadastros(next);
    showToast("Turma cadastrada.");
  }
  async function removeTurma(id: string) {
    const next = { ...cadastros, turmas: cadastros.turmas.filter((t: any) => t.id !== id) };
    await persistCadastros(next);
  }

  async function addModalidade(nome: string) {
    if (!nome) return showToast("Informe o nome da modalidade.", "error");
    const next = { ...cadastros, modalidades: [...cadastros.modalidades, { id: uid(), nome }] };
    await persistCadastros(next);
    showToast("Modalidade cadastrada.");
  }
  async function removeModalidade(id: string) {
    const next = { ...cadastros, modalidades: cadastros.modalidades.filter((m: any) => m.id !== id) };
    await persistCadastros(next);
  }

  async function addAvaliador(nome: string, funcao: string) {
    if (!nome || !funcao) return showToast("Informe nome e função.", "error");
    const next = { ...cadastros, avaliadores: [...cadastros.avaliadores, { id: uid(), nome, funcao }] };
    await persistCadastros(next);
    showToast("Avaliador cadastrado.");
  }
  async function removeAvaliador(id: string) {
    const next = { ...cadastros, avaliadores: cadastros.avaliadores.filter((a: any) => a.id !== id) };
    await persistCadastros(next);
  }

  const SECOES = [
    { id: "professores", label: "Professores" },
    { id: "turmas", label: "Turmas" },
    { id: "modalidades", label: "Modalidades" },
    { id: "avaliadores", label: "Avaliadores" },
  ];

  return (
    <div>
      <PageHeader title="Cadastros" sub="Gerencie professores, turmas, modalidades e avaliadores" />

      <div className="tabs-sub">
        {SECOES.map((s) => (
          <button key={s.id} className={`tab-sub${secao === s.id ? " active" : ""}`} onClick={() => setSecao(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      {secao === "professores" && (
        <ProfessorForm cadastros={cadastros} onAdd={addProfessor} onToggle={toggleProfessorStatus} onRemove={removeProfessor} />
      )}
      {secao === "turmas" && <TurmaForm cadastros={cadastros} onAdd={addTurma} onRemove={removeTurma} />}
      {secao === "modalidades" && <ModalidadeForm cadastros={cadastros} onAdd={addModalidade} onRemove={removeModalidade} />}
      {secao === "avaliadores" && <AvaliadorForm cadastros={cadastros} onAdd={addAvaliador} onRemove={removeAvaliador} />}
    </div>
  );
}

function ProfessorForm({ cadastros, onAdd, onToggle, onRemove }: any) {
  const [nome, setNome] = useState("");
  const [modalidade, setModalidade] = useState("");
  return (
    <div>
      <div className="card">
        <div className="form-grid">
          <Field label="Nome do professor">
            <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Carlos Silva" />
          </Field>
          <Field label="Modalidade">
            <Select value={modalidade} onChange={setModalidade} placeholder="Selecione a modalidade" options={cadastros.modalidades.map((m: any) => ({ value: m.nome, label: m.nome }))} />
          </Field>
        </div>
        <button
          className="btn btn-primary"
          style={{ marginTop: 12 }}
          onClick={() => {
            onAdd(nome.trim(), modalidade);
            setNome("");
            setModalidade("");
          }}
        >
          <Plus size={16} /> Adicionar professor
        </button>
        {cadastros.modalidades.length === 0 && <p className="field-hint" style={{ marginTop: 8 }}>Cadastre uma modalidade primeiro.</p>}
      </div>

      <div className="card" style={{ marginTop: 16, padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Modalidade</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cadastros.professores.map((p: any) => (
              <tr key={p.id}>
                <td>{p.nome}</td>
                <td>{p.modalidade}</td>
                <td>
                  <button className={`status-toggle ${p.status === "Inativo" ? "inativo" : "ativo"}`} onClick={() => onToggle(p.id)}>
                    {p.status === "Inativo" ? "Inativo" : "Ativo"}
                  </button>
                </td>
                <td>
                  <button className="icon-btn" onClick={() => onRemove(p.id)}>
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cadastros.professores.length === 0 && (
          <div style={{ padding: 20 }}>
            <EmptyState icon={Users} title="Nenhum professor cadastrado" />
          </div>
        )}
      </div>
    </div>
  );
}

function TurmaForm({ cadastros, onAdd, onRemove }: any) {
  const [nome, setNome] = useState("");
  const [qtd, setQtd] = useState("");
  return (
    <div>
      <div className="card">
        <div className="form-grid">
          <Field label="Nome / número da turma">
            <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Turma A - Manhã" />
          </Field>
          <Field label="Quantidade de aprendizes">
            <input type="number" min="0" className="input" value={qtd} onChange={(e) => setQtd(e.target.value)} placeholder="Ex.: 20" />
          </Field>
        </div>
        <button
          className="btn btn-primary"
          style={{ marginTop: 12 }}
          onClick={() => {
            onAdd(nome.trim(), Number(qtd) || 0);
            setNome("");
            setQtd("");
          }}
        >
          <Plus size={16} /> Adicionar turma
        </button>
      </div>
      <div className="card" style={{ marginTop: 16, padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Turma</th>
              <th>Aprendizes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cadastros.turmas.map((t: any) => (
              <tr key={t.id}>
                <td>{t.nome}</td>
                <td>{t.qtd}</td>
                <td>
                  <button className="icon-btn" onClick={() => onRemove(t.id)}>
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cadastros.turmas.length === 0 && (
          <div style={{ padding: 20 }}>
            <EmptyState icon={Users} title="Nenhuma turma cadastrada" />
          </div>
        )}
      </div>
    </div>
  );
}

function ModalidadeForm({ cadastros, onAdd, onRemove }: any) {
  const [nome, setNome] = useState("");
  return (
    <div>
      <div className="card">
        <Field label="Nome da modalidade">
          <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Futebol Society" />
        </Field>
        <button
          className="btn btn-primary"
          style={{ marginTop: 12 }}
          onClick={() => {
            onAdd(nome.trim());
            setNome("");
          }}
        >
          <Plus size={16} /> Adicionar modalidade
        </button>
      </div>
      <div className="card" style={{ marginTop: 16, padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Modalidade</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cadastros.modalidades.map((m: any) => (
              <tr key={m.id}>
                <td>{m.nome}</td>
                <td>
                  <button className="icon-btn" onClick={() => onRemove(m.id)}>
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cadastros.modalidades.length === 0 && (
          <div style={{ padding: 20 }}>
            <EmptyState icon={Settings} title="Nenhuma modalidade cadastrada" />
          </div>
        )}
      </div>
    </div>
  );
}

function AvaliadorForm({ cadastros, onAdd, onRemove }: any) {
  const [nome, setNome] = useState("");
  const [funcao, setFuncao] = useState("");
  return (
    <div>
      <div className="card">
        <div className="form-grid">
          <Field label="Nome do avaliador">
            <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Ana Souza" />
          </Field>
          <Field label="Função">
            <input className="input" value={funcao} onChange={(e) => setFuncao(e.target.value)} placeholder="Ex.: Coordenadora Pedagógica" />
          </Field>
        </div>
        <button
          className="btn btn-primary"
          style={{ marginTop: 12 }}
          onClick={() => {
            onAdd(nome.trim(), funcao.trim());
            setNome("");
            setFuncao("");
          }}
        >
          <Plus size={16} /> Adicionar avaliador
        </button>
      </div>
      <div className="card" style={{ marginTop: 16, padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Função</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cadastros.avaliadores.map((a: any) => (
              <tr key={a.id}>
                <td>{a.nome}</td>
                <td>{a.funcao}</td>
                <td>
                  <button className="icon-btn" onClick={() => onRemove(a.id)}>
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cadastros.avaliadores.length === 0 && (
          <div style={{ padding: 20 }}>
            <EmptyState icon={Settings} title="Nenhum avaliador cadastrado" />
          </div>
        )}
      </div>
    </div>
  );
}