import { useState, useRef, useEffect, createContext, useContext } from "react";

/* ── THEMES ─────────────────────────────── */
const DARK = {
  BG:"#030B1C", SURF:"#060E22", CARD:"#091428", CARDH:"#0D1A32",
  BDR:"#132040", BDRH:"#1F3464",
  ACC:"#00C8FF", PUR:"#9055FF", GRN:"#00F0A0", AMB:"#FFC040", RED:"#FF3F6C",
  T1:"#D5E5FF", T2:"#5C7AA8", T3:"#243660", scrollThumb:"#1F3464", isDark:true,
};
const LIGHT = {
  BG:"#F2F5FB", SURF:"#FFFFFF", CARD:"#FFFFFF", CARDH:"#F4F7FD",
  BDR:"#E2E8F4", BDRH:"#BDC8E0",
  ACC:"#0091CC", PUR:"#6B40D6", GRN:"#009966", AMB:"#B87000", RED:"#D42050",
  T1:"#0D1830", T2:"#486080", T3:"#9AADCA", scrollThumb:"#BDC8E0", isDark:false,
};
const ThemeCtx = createContext(DARK);
const useT = () => useContext(ThemeCtx);

/* ── DATA ───────────────────────────────── */
const QN = 3, ST = 8;
const mkCkt = () => Array.from({ length:QN }, () => Array(ST).fill(null));

const GATE_DEFS = (t) => [
  { id:"H",  lbl:"H",  clr:t.ACC,                        desc:"Hadamard" },
  { id:"X",  lbl:"X",  clr:t.RED,                        desc:"Pauli-X"  },
  { id:"Y",  lbl:"Y",  clr:t.AMB,                        desc:"Pauli-Y"  },
  { id:"Z",  lbl:"Z",  clr:t.GRN,                        desc:"Pauli-Z"  },
  { id:"S",  lbl:"S",  clr:t.isDark?"#00D4C8":"#009990", desc:"S Gate"   },
  { id:"T",  lbl:"T",  clr:t.isDark?"#FF8C42":"#C05820", desc:"T Gate"   },
  { id:"CX", lbl:"⊕",  clr:t.PUR,                        desc:"CNOT"     },
  { id:"M",  lbl:"M",  clr:t.isDark?"#8899BB":"#607090", desc:"측정"     },
];

const SOURCES = [
  { id:1, type:"doc", icon:"🔗", title:"IBM Quantum 논문",
    author:"arxiv.org", av:"🔗", addedAt:"2025-02-03",
    tags:["양자컴퓨팅","입문","IBM"],
    content:"A fast and elucidating introduction to quantum computing for computer scientists. 이 논문은 CS 배경 학습자를 위한 양자 컴퓨팅 입문서로, 회로 모델과 기본 알고리즘을 설명합니다." },
  { id:2, type:"doc", icon:"📕", title:"양자역학 기초 노트.pdf",
    author:"파일", av:"📁", addedAt:"2025-01-15",
    tags:["양자역학","큐비트","얽힘"],
    content:"양자 컴퓨팅은 양자역학의 원리를 이용한 계산 패러다임입니다. 큐비트(qubit)는 0과 1의 중첩 상태를 동시에 가질 수 있으며, Hadamard 게이트는 |0⟩을 (|0⟩+|1⟩)/√2의 중첩 상태로 만들고, CNOT 게이트는 두 큐비트를 얽힌 상태로 만듭니다. 양자 얽힘은 Bell 상태가 대표적입니다." },
  { id:3, type:"doc", icon:"📄", title:"Grover 알고리즘 요약",
    author:"직접 작성", av:"📝", addedAt:"2025-01-10",
    tags:["Grover","검색","알고리즘"],
    content:"Grover의 검색 알고리즘은 N개의 비정렬 데이터에서 특정 항목을 O(√N) 시간에 찾습니다. 오라클이 목표 상태에 위상을 뒤집고, 디퓨저가 평균에 대한 반전을 수행합니다." },
];

const REF_CIRCUITS = [
  { id:201, type:"ref-circuit", icon:"🔗", title:"Bell 상태 (기본)",
    author:"qiskit.org", av:"🔗", addedAt:"2025-02-01",
    tags:["Bell","얽힘","입문"],
    content:"2-큐비트 Bell 상태의 표준 구현. Hadamard + CNOT으로 최대 얽힘 상태 |Φ+⟩를 만드는 가장 기본적인 양자 회로.",
    gates:[{q:0,t:0,id:"H"},{q:1,t:1,id:"CX"},{q:0,t:3,id:"M"},{q:1,t:3,id:"M"}] },
  { id:202, type:"ref-circuit", icon:"⚛", title:"ghz_state.py",
    author:"파일", av:"📁", addedAt:"2025-01-20",
    tags:["GHZ","3큐비트","얽힘"],
    content:"3-큐비트 GHZ 상태 구현. Bell 상태를 확장해 3개 큐비트를 동시에 얽는 멀티파티 얽힘 회로.",
    gates:[{q:0,t:0,id:"H"},{q:0,t:1,id:"CX"},{q:1,t:2,id:"CX"},{q:0,t:4,id:"M"},{q:1,t:4,id:"M"},{q:2,t:4,id:"M"}] },
  { id:203, type:"ref-circuit", icon:"⚛", title:"Grover 오라클 (2큐비트)",
    author:"직접 작성", av:"📝", addedAt:"2025-01-12",
    tags:["Grover","오라클","검색"],
    content:"2큐비트 Grover 오라클 구현. 목표 상태 |11⟩의 위상을 뒤집는 회로. 디퓨저와 함께 사용하면 √N 검색이 가능.",
    gates:[{q:0,t:0,id:"H"},{q:1,t:0,id:"H"},{q:0,t:2,id:"Z"},{q:1,t:2,id:"Z"},{q:0,t:4,id:"H"},{q:1,t:4,id:"H"}] },
];

const TUTORIALS = [
  { id:"bell",   icon:"🔗", title:"Bell 상태 만들기",  level:"입문", desc:"2-큐비트 얽힘의 기본, H + CNOT 회로" },
  { id:"ghz",    icon:"🌐", title:"GHZ 상태",          level:"초급", desc:"3-큐비트 멀티파티 얽힘 상태"         },
  { id:"grover", icon:"🔍", title:"Grover 오라클",     level:"중급", desc:"Grover 알고리즘의 핵심 구조 구현"    },
  { id:"vqe",    icon:"⚡", title:"VQE 안사츠",        level:"고급", desc:"변분 양자 고유값 분해기 회로"        },
];

const TUTORIAL_LESSONS = {
  bell: [
    { title:"큐비트와 중첩 개념 복습",          done:true,  gates:[],
      prompt:"Bell 상태 커리큘럼 레슨 1입니다. 큐비트란 무엇인지, 중첩 상태가 왜 양자 컴퓨팅의 핵심인지 간단히 설명해주세요." },
    { title:"Hadamard 게이트로 q[0] 중첩 생성", done:true,  gates:[{q:0,t:0,id:"H"}],
      prompt:"Bell 레슨 2: 회로에 H 게이트를 q[0]에 배치했습니다. Hadamard 게이트가 중첩 상태를 만드는 원리를 수식과 함께 설명해주세요." },
    { title:"CNOT으로 q[0]→q[1] 얽힘 생성",    done:false, gates:[{q:0,t:0,id:"H"},{q:1,t:1,id:"CX"}],
      prompt:"Bell 레슨 3: CNOT을 추가해 Bell 상태를 완성했습니다. 오른쪽 시뮬레이터 결과 50%/50%를 해석해주세요." },
    { title:"Bell 상태 측정 및 결과 해석",       done:false, gates:[{q:0,t:0,id:"H"},{q:1,t:1,id:"CX"},{q:0,t:3,id:"M"},{q:1,t:3,id:"M"}],
      prompt:"Bell 레슨 4: 측정 게이트를 추가했습니다. 시뮬레이터가 |00⟩과 |11⟩만 나오는 이유를 설명해주세요." },
    { title:"4가지 Bell 상태 변형 실습",         done:false, gates:[{q:0,t:0,id:"X"},{q:0,t:1,id:"H"},{q:1,t:2,id:"CX"}],
      prompt:"Bell 레슨 5: X 게이트를 먼저 적용한 변형입니다. 4가지 Bell 상태의 차이를 설명해주세요." },
  ],
  ghz: [
    { title:"GHZ 상태란 무엇인가",               done:false, gates:[],
      prompt:"GHZ 레슨 1: GHZ 상태란 무엇인지, Bell 상태와 어떻게 다른지 설명해주세요." },
    { title:"q[0]에 Hadamard 적용",             done:false, gates:[{q:0,t:0,id:"H"}],
      prompt:"GHZ 레슨 2: q[0]에 H 게이트를 적용했습니다. 3-큐비트 상태벡터를 설명해주세요." },
    { title:"CNOT: q[0] to q[1]",              done:false, gates:[{q:0,t:0,id:"H"},{q:0,t:1,id:"CX"}],
      prompt:"GHZ 레슨 3: CNOT 적용 후 현재 상태를 설명해주세요." },
    { title:"CNOT: q[1] to q[2]",              done:false, gates:[{q:0,t:0,id:"H"},{q:0,t:1,id:"CX"},{q:1,t:2,id:"CX"}],
      prompt:"GHZ 레슨 4: 3-큐비트 GHZ 상태 완성. 시뮬레이터 결과를 해석해주세요." },
    { title:"3-큐비트 측정 및 비국소성 확인",   done:false, gates:[{q:0,t:0,id:"H"},{q:0,t:1,id:"CX"},{q:1,t:2,id:"CX"},{q:0,t:4,id:"M"},{q:1,t:4,id:"M"},{q:2,t:4,id:"M"}],
      prompt:"GHZ 레슨 5: 모든 큐비트를 측정합니다. 비국소성을 설명해주세요." },
    { title:"GHZ와 Bell 상태 비교",             done:false, gates:[],
      prompt:"GHZ 레슨 6: Bell 상태와 GHZ 상태를 비교 정리해주세요." },
  ],
  grover: [
    { title:"Grover 알고리즘 개요",              done:false, gates:[],
      prompt:"Grover 레슨 1: O(sqrt(N)) 검색이 가능한 원리를 직관적으로 설명해주세요." },
    { title:"균등 중첩 초기화",                  done:false, gates:[{q:0,t:0,id:"H"},{q:1,t:0,id:"H"},{q:2,t:0,id:"H"}],
      prompt:"Grover 레슨 2: 모든 큐비트 H 적용. 각 상태의 진폭이 1/sqrt(8)인 이유를 설명해주세요." },
    { title:"오라클 함수 설계",                  done:false, gates:[{q:0,t:0,id:"H"},{q:1,t:0,id:"H"},{q:2,t:0,id:"H"},{q:0,t:2,id:"Z"},{q:1,t:2,id:"Z"}],
      prompt:"Grover 레슨 3: 오라클이 목표 상태 위상을 뒤집는 방법을 설명해주세요." },
    { title:"위상 킥백 이해",                    done:false, gates:[],
      prompt:"Grover 레슨 4: Phase Kickback의 수학적 원리를 설명해주세요." },
    { title:"디퓨저 구현",                       done:false, gates:[{q:0,t:0,id:"H"},{q:1,t:0,id:"H"},{q:2,t:0,id:"H"},{q:0,t:2,id:"Z"},{q:0,t:3,id:"H"},{q:1,t:3,id:"H"},{q:2,t:3,id:"H"}],
      prompt:"Grover 레슨 5: H-Z-H 패턴의 디퓨저가 진폭을 증폭시키는 원리를 설명해주세요." },
    { title:"최적 반복 횟수",                    done:false, gates:[], prompt:"Grover 레슨 6: 최적 반복 횟수 pi*sqrt(N)/4가 나오는 이유를 설명해주세요." },
    { title:"시뮬레이션 및 결과 검증",           done:false, gates:[{q:0,t:0,id:"H"},{q:1,t:0,id:"H"},{q:2,t:0,id:"H"},{q:0,t:2,id:"Z"},{q:0,t:3,id:"H"},{q:1,t:3,id:"H"},{q:2,t:3,id:"H"}],
      prompt:"Grover 레슨 7: 완성된 회로 시뮬레이션 결과를 분석해주세요." },
  ],
  vqe: [
    { title:"VQE 알고리즘 원리",                 done:false, gates:[], prompt:"VQE 레슨 1: VQE가 분자 바닥 에너지를 찾는 방법을 설명해주세요." },
    { title:"안사츠 회로 설계",                  done:false, gates:[{q:0,t:0,id:"H"},{q:1,t:0,id:"H"},{q:0,t:1,id:"CX"}], prompt:"VQE 레슨 2: 안사츠 회로를 배치했습니다. 설명해주세요." },
    { title:"파라미터화된 회전 게이트",           done:false, gates:[{q:0,t:0,id:"H"},{q:0,t:1,id:"S"},{q:1,t:0,id:"H"},{q:1,t:1,id:"T"},{q:0,t:2,id:"CX"}], prompt:"VQE 레슨 3: 파라미터화된 게이트 최적화를 설명해주세요." },
    { title:"해밀토니안 기대값 측정",             done:false, gates:[{q:0,t:0,id:"H"},{q:1,t:0,id:"H"},{q:0,t:1,id:"CX"},{q:0,t:3,id:"M"},{q:1,t:3,id:"M"}], prompt:"VQE 레슨 4: 해밀토니안 기대값 측정 방법을 설명해주세요." },
    { title:"고전 최적화 루프",                  done:false, gates:[], prompt:"VQE 레슨 5: 하이브리드 VQE 구조를 설명해주세요." },
    { title:"수렴 및 에너지 최솟값",              done:false, gates:[], prompt:"VQE 레슨 6: 수렴 판단과 Barren Plateau 문제를 설명해주세요." },
    { title:"H2 분자 에너지 계산",               done:false, gates:[{q:0,t:0,id:"H"},{q:1,t:0,id:"H"},{q:0,t:1,id:"CX"},{q:0,t:2,id:"S"},{q:1,t:2,id:"T"}], prompt:"VQE 레슨 7: H2 에너지 계산 코드 예시를 보여주세요." },
    { title:"NISQ 하드웨어 고려사항",            done:false, gates:[], prompt:"VQE 레슨 8: 실제 하드웨어에서의 노이즈와 에러 완화를 설명해주세요." },
  ],
};

const DOMAIN_PROBLEMS = [
  { id:"fin_p1", domain:"금융", domainIcon:"💹", level:"입문",
    title:"포트폴리오 리스크 동시 평가",
    scenario:"자산운용사가 주식·채권·원자재 3개 자산의 모든 조합을 양자 병렬성으로 동시에 평가합니다.",
    desc:"각 큐비트를 하나의 자산으로 매핑합니다. H 게이트로 모든 큐비트를 중첩시켜 8가지 투자 조합을 한 번에 탐색하세요.",
    hint:"q[0], q[1], q[2] 모두 같은 타임스텝에 H 게이트를 배치하세요.",
    answerGates:[{q:0,t:0,id:"H"},{q:1,t:0,id:"H"},{q:2,t:0,id:"H"}] },
  { id:"sec_p1", domain:"보안", domainIcon:"🔐", level:"입문",
    title:"양자 키 분배 (QKD) 얽힘 쌍",
    scenario:"금융기관 간 도청 불가능한 암호키를 공유하는 BB84/E91 프로토콜의 핵심 단계입니다.",
    desc:"q[0](송신자)에 H 게이트, 이후 q[0]→q[1] CNOT으로 Bell 쌍을 생성하세요. 측정 시 |00⟩과 |11⟩만 나와야 합니다.",
    hint:"H on q[0], 다음 타임스텝에 CX(q[0]→q[1]) 배치.",
    answerGates:[{q:0,t:0,id:"H"},{q:1,t:1,id:"CX"}] },
  { id:"bio_p1", domain:"바이오", domainIcon:"🧬", level:"초급",
    title:"H₂ 분자 VQE 초기 상태",
    scenario:"제약회사가 신약 후보 물질의 분자 결합 에너지를 VQE 알고리즘으로 시뮬레이션하는 출발점입니다.",
    desc:"수소 분자의 두 전자 오비탈을 q[0], q[1]로 표현합니다. H + CNOT으로 전자 상관관계를 반영한 얽힘 초기 상태를 만드세요.",
    hint:"Bell 상태와 동일한 구조입니다. H on q[0] → CX q[0]→q[1].",
    answerGates:[{q:0,t:0,id:"H"},{q:1,t:1,id:"CX"}] },
  { id:"log_p1", domain:"물류", domainIcon:"🚚", level:"초급",
    title:"최적 배송 경로 탐색 초기화",
    scenario:"물류 기업이 3개 허브 도시 간 최단 경로를 Grover 알고리즘으로 탐색합니다. 첫 단계로 모든 경로에 동등한 가중치를 부여합니다.",
    desc:"3큐비트를 GHZ 상태로 얽어 경로 탐색 공간을 준비하세요. H → CX(q0→q1) → CX(q1→q2) 순서로 배치합니다.",
    hint:"q[0]에 H, 다음에 CX q[0]→q[1], 그 다음 CX q[1]→q[2].",
    answerGates:[{q:0,t:0,id:"H"},{q:1,t:1,id:"CX"},{q:2,t:2,id:"CX"}] },
  { id:"nrg_p1", domain:"에너지", domainIcon:"⚡", level:"입문",
    title:"스마트 전력망 상태 중첩",
    scenario:"에너지 관리 시스템이 3개 발전소의 가동/중단 시나리오 8가지를 동시에 분석합니다.",
    desc:"각 큐비트를 발전소 하나로 매핑하고 H 게이트로 모든 가동 조합을 중첩 상태로 준비하세요.",
    hint:"q[0], q[1], q[2] 모두 H 게이트.",
    answerGates:[{q:0,t:0,id:"H"},{q:1,t:0,id:"H"},{q:2,t:0,id:"H"}] },
  { id:"mat_p1", domain:"소재", domainIcon:"🔬", level:"초급",
    title:"결정 격자 스핀 초기화",
    scenario:"신소재 연구소가 원자 스핀을 양자 시뮬레이션으로 모델링하는 출발점입니다.",
    desc:"X 게이트로 스핀 다운 상태를 초기화하고 H로 스핀 방향 중첩을 만드세요.",
    hint:"q[0]에 X, 다음 타임스텝에 H를 배치하세요.",
    answerGates:[{q:0,t:0,id:"X"},{q:0,t:1,id:"H"}] },
  { id:"tel_p1", domain:"통신", domainIcon:"📡", level:"입문",
    title:"양자 텔레포테이션 얽힘 채널",
    scenario:"양자 통신 기업이 도시 간 양자 정보를 전송하기 위한 얽힘 채널을 설정합니다.",
    desc:"Alice(q[0])에 H, Bob(q[1])과 CNOT으로 얽어 도청 불가 통신 채널을 만드세요.",
    hint:"H on q[0], CX q[0]→q[1].",
    answerGates:[{q:0,t:0,id:"H"},{q:1,t:1,id:"CX"}] },
];

const COLLAB_MEMBERS = [
  { name:"김민준", av:"🧑‍💻", status:"회로 편집 중", online:true  },
  { name:"이서연", av:"👩‍🔬", status:"커리큘럼 중",  online:true  },
  { name:"박지호", av:"👨‍🎓", status:"오프라인",     online:false },
];

function buildCkt(specs) {
  var rows = mkCkt();
  (specs || []).forEach(function(g) { if (g.q < QN && g.t < ST) rows[g.q][g.t] = g.id; });
  return rows;
}

/* ── API ────────────────────────────────── */
function makeSysPrompt(ctx) {
  var base = "당신은 QX Assistant입니다. 양자 컴퓨팅 전문 튜터로, 한국어로 답변하되 기술 용어는 영어 그대로 사용합니다. 친절하고 교육적으로 답변하세요.";
  if (ctx.sources && ctx.sources.length > 0) {
    ctx.sources.forEach(function(src) {
      base += " [자료] " + src.title + ": " + src.content;
    });
    base += " 위 자료들을 기반으로 답변하세요.";
  }
  if (ctx.tutorial) base += " 현재 커리큘럼: " + ctx.tutorial.title + " 진행 중.";
  if (ctx.searchMode) {
    var sType = ctx.searchType === "circuit" ? "양자 회로 레퍼런스" : "양자 컴퓨팅 문서/논문";
    var srcType = ctx.searchType || "doc";
    base += " [자료 탐색 모드] 사용자가 " + sType + " 를 찾고 있습니다. 대화를 통해 관심 주제와 수준을 파악한 뒤 자료를 추천하세요. 추천할 때는 반드시 응답 끝에 [SOURCES] ... [/SOURCES] 블록을 포함하세요. 블록 안에는 JSON 배열: 각 항목에 title(string), url(string), type(" + srcType + "), tags(string[]), desc(string) 필드. 실제 URL만 사용하고 2~4개 추천하세요.";
  }
  return base;
}

async function callClaude(messages, sys) {
  try {
    var res = await fetch("/api/claude/v1/messages", {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01"
      },
      body:JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:1200, system:sys, messages:messages }),
    });
    if (!res.ok) {
      var err = await res.text();
      console.error("Claude API error", res.status, err);
      return "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    }
    var d = await res.json();
    return d.content && d.content[0] ? d.content[0].text : "응답을 가져올 수 없습니다.";
  } catch(e) {
    console.error("callClaude exception", e);
    return "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
}

function parseCircuit(text) {
  var m = text.match(/```circuit\n([\s\S]*?)\n```/);
  if (!m) return null;
  try {
    var d = JSON.parse(m[1]);
    var rows = mkCkt();
    (d.gates || []).forEach(function(g) { if (g.q < QN && g.t < ST) rows[g.q][g.t] = g.id; });
    return { rows:rows, note:d.note||"" };
  } catch (e) { return null; }
}

function stripCircuit(text) {
  return text.replace(/```circuit\n[\s\S]*?\n```/g, "").trim();
}

/* ── QUANTUM SIMULATOR ──────────────────── */
var IS2 = 1/Math.sqrt(2);
function cxn(re, im) { return {re:re||0, im:im||0}; }
function cAdd(a,b) { return cxn(a.re+b.re, a.im+b.im); }
function cMul(a,b) { return cxn(a.re*b.re-a.im*b.im, a.re*b.im+a.im*b.re); }
function cAbs2(a) { return a.re*a.re+a.im*a.im; }

var GMATS = {
  H: [[cxn(IS2),cxn(IS2)], [cxn(IS2),cxn(-IS2)]],
  X: [[cxn(0),cxn(1)], [cxn(1),cxn(0)]],
  Y: [[cxn(0),cxn(0,-1)], [cxn(0,1),cxn(0)]],
  Z: [[cxn(1),cxn(0)], [cxn(0),cxn(-1)]],
  S: [[cxn(1),cxn(0)], [cxn(0),cxn(0,1)]],
  T: [[cxn(1),cxn(0)], [cxn(0),cxn(IS2,IS2)]],
};

function runSim(circuit) {
  var N = 1<<QN;
  var sv = [];
  for (var k=0;k<N;k++) sv.push(k===0?cxn(1):cxn(0));
  for (var step=0; step<ST; step++) {
    for (var q=0; q<QN; q++) {
      var gid = circuit[q][step];
      if (!gid || gid==="M") continue;
      if (gid==="CX") {
        var tgt = q+1<QN ? q+1 : q-1;
        if (tgt<0||tgt>=QN||tgt===q) continue;
        var cBit=QN-1-q, tBit=QN-1-tgt, next1=sv.slice();
        for (var i=0;i<N;i++) {
          if (((i>>cBit)&1) && i<(i^(1<<tBit))) {
            var j=i^(1<<tBit), tmp=next1[i]; next1[i]=next1[j]; next1[j]=tmp;
          }
        }
        sv=next1;
      } else if (GMATS[gid]) {
        var mat=GMATS[gid], bit=QN-1-q, next2=sv.map(function(s){return cxn(s.re,s.im);});
        for (var ii=0;ii<N;ii++) {
          if (!((ii>>bit)&1)) {
            var jj=ii|(1<<bit);
            next2[ii]=cAdd(cMul(mat[0][0],sv[ii]),cMul(mat[0][1],sv[jj]));
            next2[jj]=cAdd(cMul(mat[1][0],sv[ii]),cMul(mat[1][1],sv[jj]));
          }
        }
        sv=next2;
      }
    }
  }
  var probs=sv.map(cAbs2);
  var labels=Array.from({length:N},function(_,i){return "|"+i.toString(2).padStart(QN,"0")+"⟩";});
  var shots=new Array(N).fill(0);
  for (var s=0;s<1024;s++) {
    var r=Math.random(), cum=0;
    for (var kk=0;kk<N;kk++){cum+=probs[kk];if(r<cum){shots[kk]++;break;}}
  }
  return {sv:sv,probs:probs,labels:labels,shots:shots};
}

/* ── UTILS ──────────────────────────────── */
function renderMD(text, acc) {
  if (!text) return "";
  var a = acc || "#00C8FF";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`\n]+)`/g, "<code style=\"background:"+a+"18;color:"+a+";padding:1px 5px;border-radius:3px;font-size:.9em;font-family:monospace\">$1</code>")
    .replace(/\n/g, "<br/>");
}

function ProgBar(props) {
  var t = useT();
  return (
    <div style={{height:3,background:t.BDR,borderRadius:2,overflow:"hidden"}}>
      <div style={{width:(props.pct||0)+"%",height:"100%",background:props.color||t.ACC,borderRadius:2,transition:"width .6s"}}/>
    </div>
  );
}

function Tag(props) {
  var c = props.color;
  return (
    <span style={{display:"inline-block",padding:"2px 9px",borderRadius:20,fontSize:10.5,fontWeight:600,background:c+"18",border:"1px solid "+c+"44",color:c}}>
      {props.children}
    </span>
  );
}

/* ── SIMULATION SECTION ─────────────────── */
function SimPanel(props) {
  var t = useT();
  var sim = props.sim;
  var accentColor = props.accentColor || null;
  var compact = props.compact || false;
  var [showSV, setShowSV] = useState(false);
  var rows = sim.probs
    .map(function(p,i){return {p:p,i:i,label:sim.labels[i],shots:sim.shots[i],amp:sim.sv[i]};})
    .filter(function(r){return r.p>0.005;})
    .sort(function(a,b){return b.p-a.p;});
  var maxP = Math.max.apply(null, rows.map(function(r){return r.p;}).concat([0.001]));
  var entropy = 0; rows.forEach(function(r){if(r.p>0.001) entropy-=r.p*Math.log2(r.p);});
  var isEntangled = rows.length>1 && rows[0].p<0.99;
  var topState = rows[0]||null;
  return (
    <div style={{flex:1,minWidth:0}}>
      {/* stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px 0",fontSize:10,marginBottom:10}}>
        <div style={{display:"flex",gap:6,alignItems:"baseline"}}><span style={{color:t.T3,minWidth:compact?36:50}}>상태 수</span><span style={{color:t.T1,fontWeight:600}}>{rows.length}</span></div>
        <div style={{display:"flex",gap:6,alignItems:"baseline"}}><span style={{color:t.T3,minWidth:compact?36:50}}>엔트로피</span><span style={{color:t.T1,fontWeight:600}}>{entropy.toFixed(3)}</span>{!compact&&<span style={{color:t.T3}}>bits</span>}</div>
        {topState&&<div style={{display:"flex",gap:6,alignItems:"baseline"}}><span style={{color:t.T3,minWidth:compact?36:50}}>{compact?"최빈":"최빈 상태"}</span><span style={{color:t.T1,fontWeight:600}}>{topState.label}</span><span style={{color:t.T3}}>{(topState.p*100).toFixed(1)}%</span></div>}
        <div style={{display:"flex",gap:6,alignItems:"baseline"}}><span style={{color:t.T3,minWidth:compact?36:50}}>얽힘</span><span style={{color:isEntangled?t.ACC:t.T3,fontWeight:isEntangled?600:400}}>{isEntangled?"있음":"없음"}</span></div>
      </div>
      {/* 확률 분포 */}
      <div style={{color:t.T3,fontSize:9.5,letterSpacing:".07em",textTransform:"uppercase",marginBottom:8}}>측정 확률 분포</div>
      {rows.length===0 ? (
        <div style={{color:t.T3,fontSize:11.5,textAlign:"center",padding:"16px 0",background:t.isDark?t.BG:t.CARDH,borderRadius:8}}>|000⟩ = 100% (초기 상태)</div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {rows.map(function(row){
            var pct=(row.p*100).toFixed(1);
            var barW=Math.round((row.p/maxP)*100);
            var clr=accentColor||(row.p>0.45?t.ACC:row.p>0.2?t.PUR:t.AMB);
            return (
              <div key={row.i} style={{display:"flex",flexDirection:"column",gap:3}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <span style={{color:clr,background:clr+"15",border:"1px solid "+clr+"33",fontSize:10.5,fontWeight:700,padding:"2px 7px",borderRadius:6,flexShrink:0,minWidth:compact?44:52,textAlign:"center"}}>{row.label}</span>
                  <div style={{flex:1,height:16,background:t.isDark?t.BG:t.CARDH,borderRadius:4,overflow:"hidden"}}>
                    <div style={{width:barW+"%",height:"100%",background:"linear-gradient(90deg,"+clr+","+clr+"88)",borderRadius:4,transition:"width .45s ease"}}/>
                  </div>
                  <span style={{color:t.T1,fontSize:12.5,fontWeight:700,flexShrink:0,width:42,textAlign:"right"}}>{pct}%</span>
                  {!compact&&<span style={{color:t.T3,fontSize:9.5,flexShrink:0,width:30,textAlign:"right"}}>{row.shots}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* 상태벡터 */}
      {rows.length>0 && !compact && (
        <div style={{marginTop:10}}>
          <button onClick={function(){setShowSV(function(v){return !v;});}} style={{background:"transparent",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:5,padding:0,marginBottom:showSV?6:0}}>
            <span style={{color:t.T3,fontSize:9.5,letterSpacing:".07em",textTransform:"uppercase"}}>상태벡터</span>
            <span style={{color:t.T3,fontSize:9,transition:"transform .15s",display:"inline-block",transform:showSV?"rotate(90deg)":"rotate(0deg)"}}>›</span>
          </button>
          {showSV && <div style={{background:t.isDark?t.BG:t.CARDH,borderRadius:8,padding:"8px 10px",display:"flex",flexDirection:"column",gap:4}}>
            {rows.map(function(row){
              var mag=Math.sqrt(cAbs2(row.amp));
              var hasIm=Math.abs(row.amp.im)>0.001;
              var phaseDeg=hasIm?(Math.atan2(row.amp.im,row.amp.re)*180/Math.PI).toFixed(0):null;
              var clr=accentColor||(row.p>0.45?t.ACC:row.p>0.2?t.PUR:t.AMB);
              return (
                <div key={row.i} style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{color:clr,background:clr+"12",border:"1px solid "+clr+"33",fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:5,flexShrink:0}}>{row.label}</span>
                  <span style={{color:t.T1,fontSize:10.5,fontWeight:600,flex:1}}>{mag.toFixed(4)}</span>
                  {phaseDeg&&<span style={{color:t.T3,fontSize:9.5}}>∠{phaseDeg}°</span>}
                  <div style={{width:32,height:6,background:t.BDR,borderRadius:3,overflow:"hidden"}}>
                    <div style={{width:(mag*100).toFixed(0)+"%",height:"100%",background:clr,borderRadius:3}}/>
                  </div>
                </div>
              );
            })}
          </div>}
        </div>
      )}
    </div>
  );
}

function SimulationSection(props) {
  var t = useT();
  var circuit = props.circuit;
  var circuits = props.circuits || [];
  var [sim, setSim] = useState(function(){return runSim(circuit);});
  var [comparing, setComparing] = useState(false);
  var [compareCircuit, setCompareCircuit] = useState(null);
  var [cmpSim, setCmpSim] = useState(null);
  var [picking, setPicking] = useState(false);
  var [open, setOpen] = useState(true);
  var hasAny = circuit.some(function(r){return r.some(function(g){return !!g;});});

  useEffect(function(){setSim(runSim(circuit));}, [circuit]);

  function startCompare() {
    if (comparing) { setComparing(false); setCompareCircuit(null); setCmpSim(null); setPicking(false); return; }
    setPicking(true); setComparing(true);
  }
  function pickCircuit(c) { setCompareCircuit(c); setCmpSim(runSim(c.circuit)); setPicking(false); }

  return (
    <div style={{borderTop:"1px solid "+t.BDR,flexShrink:0}}>
      <div onClick={function(){setOpen(function(v){return !v;});}} style={{padding:"0 14px",height:40,display:"flex",alignItems:"center",background:t.isDark?t.CARD:t.CARDH,cursor:"pointer",userSelect:"none",...(open?{borderBottom:"1px solid "+t.BDR}:{})}}>
        <div style={{display:"flex",alignItems:"center",gap:6,flex:1}}>
          <span style={{color:t.T3,fontSize:10,transition:"transform .15s",display:"inline-block",transform:open?"rotate(90deg)":"rotate(0deg)"}}>›</span>
          <span style={{fontSize:10,color:t.T3}}>📡</span>
          <span style={{color:t.T1,fontWeight:600,fontSize:11.5}}>시뮬레이션</span>
          {!hasAny&&<span style={{color:t.T3,fontSize:10}}>— 회로를 작성해보세요</span>}
        </div>
        <button onClick={function(e){e.stopPropagation();startCompare();}} style={{background:comparing?t.PUR+"18":"transparent",border:"1px solid "+(comparing?t.PUR+"55":t.BDR),color:comparing?t.PUR:t.T2,borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>
          {comparing?"✕ 비교 종료":"⇄ 회로 비교"}
        </button>
      </div>

      {/* 회로 선택 피커 */}
      {open && picking && (
        <div style={{borderBottom:"1px solid "+t.BDR,padding:"8px 14px",background:t.isDark?t.BG:t.SURF}}>
          <div style={{color:t.T3,fontSize:10,marginBottom:6}}>비교할 저장된 회로를 선택하세요</div>
          {circuits.length===0 ? (
            <div style={{color:t.T3,fontSize:11,textAlign:"center",padding:"8px 0"}}>저장된 회로가 없습니다</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:130,overflowY:"auto"}}>
              {circuits.map(function(c){return (
                <div key={c.id} onClick={function(){pickCircuit(c);}} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:6,border:"1px solid "+t.BDR,cursor:"pointer",background:t.CARD}}>
                  <span style={{fontSize:11,color:t.ACC}}>⚛</span>
                  <span style={{flex:1,color:t.T1,fontSize:11,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.title}</span>
                  <span style={{color:t.T3,fontSize:9}}>{c.savedAt}</span>
                </div>
              );})}
            </div>
          )}
        </div>
      )}

      {/* 결과 */}
      {open && <div style={{padding:"10px 14px 12px"}}>
        {comparing && cmpSim ? (
          <div style={{display:"flex",gap:14}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:t.ACC,fontSize:10,fontWeight:700,marginBottom:8,paddingBottom:4,borderBottom:"1px solid "+t.BDR}}>현재 회로</div>
              <SimPanel sim={sim} accentColor={t.ACC} compact={true}/>
            </div>
            <div style={{width:1,background:t.BDR,flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:t.PUR,fontSize:10,fontWeight:700,marginBottom:8,paddingBottom:4,borderBottom:"1px solid "+t.BDR,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{compareCircuit?compareCircuit.title:"비교 회로"}</div>
              <SimPanel sim={cmpSim} accentColor={t.PUR} compact={true}/>
            </div>
          </div>
        ) : (
          <SimPanel sim={sim}/>
        )}
      </div>}
    </div>
  );
}

/* ── CIRCUIT CARD (inline in chat) ─────── */
function CircuitCard(props) {
  var t = useT();
  var gates = GATE_DEFS(t);
  var gById = function(id) { return gates.find(function(g){return g.id===id;}); };
  return (
    <div style={{background:t.isDark?t.BG:t.CARDH,border:"1px solid "+t.ACC+"44",borderRadius:10,padding:12,marginTop:10}}>
      <div style={{color:t.ACC,fontSize:10,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",marginBottom:8}}>⚛ 생성된 회로</div>
      <div style={{display:"flex",flexDirection:"column",gap:3,marginBottom:8}}>
        {props.data.rows.map(function(row,q) {
          return (
            <div key={q} style={{display:"flex",alignItems:"center",gap:2}}>
              <span style={{color:t.ACC,fontSize:9.5,width:24,textAlign:"right",paddingRight:4}}>q[{q}]</span>
              {row.map(function(cell,s) {
                var g = cell ? gById(cell) : null;
                return (
                  <div key={s} style={{width:18,height:16,borderRadius:3,fontSize:8,fontWeight:g?800:400,background:g?g.clr+"20":"transparent",border:"1px solid "+(g?g.clr:t.T3+"33"),display:"flex",alignItems:"center",justifyContent:"center",color:g?g.clr:t.T3}}>
                    {g?g.lbl:"─"}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {props.data.note && <div style={{color:t.T2,fontSize:10.5,marginBottom:8}}>{props.data.note}</div>}
      <button onClick={props.onLoad} style={{background:t.ACC+"15",border:"1px solid "+t.ACC+"55",color:t.ACC,padding:"4px 11px",borderRadius:6,fontSize:11,cursor:"pointer",fontWeight:700}}>→ 회로 에디터에 불러오기</button>
    </div>
  );
}

/* ── TUTORIAL NAV BAR ───────────────────── */
function TutorialNavBar(props) {
  var t = useT();
  var tutorial = props.tutorial;
  var lessonIdx = props.lessonIdx;
  var lessons = TUTORIAL_LESSONS[tutorial.id] || [];
  var lesson = lessons[lessonIdx] || {};
  var isFirst = lessonIdx===0;
  var isLast = lessonIdx>=lessons.length-1;
  var pct = Math.round(((lessonIdx+1)/lessons.length)*100);
  return (
    <div style={{borderTop:"1px solid "+t.BDR,flexShrink:0}}>
      <div style={{height:2,background:t.BDR}}>
        <div style={{width:pct+"%",height:"100%",background:"linear-gradient(90deg,"+t.ACC+","+t.PUR+")",transition:"width .5s"}}/>
      </div>
      <div style={{padding:"9px 24px",background:t.isDark?t.PUR+"10":t.PUR+"08",display:"flex",alignItems:"center",gap:12,maxWidth:760,margin:"0 auto",width:"100%"}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{color:t.T3,fontSize:10}}>📚 {tutorial.title} · 레슨 {lessonIdx+1} / {lessons.length}</div>
          <div style={{color:t.isDark?t.PUR:"#5535CC",fontWeight:600,fontSize:12.5,marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{lesson.title}</div>
        </div>
        <button onClick={props.onPrev} disabled={isFirst} style={{background:"transparent",border:"1px solid "+t.BDR,color:isFirst?t.T3:t.T2,padding:"5px 13px",borderRadius:7,fontSize:12,cursor:isFirst?"default":"pointer",flexShrink:0,opacity:isFirst?0.4:1}}>← 이전</button>
        {props.onQuiz && (
          <button onClick={props.onQuiz} style={{background:"transparent",border:"1px solid "+t.AMB+"66",color:t.AMB,padding:"5px 13px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0}}>📝 퀴즈</button>
        )}
        {isLast ? (
          <div style={{background:t.GRN+"18",border:"1px solid "+t.GRN+"55",color:t.GRN,padding:"5px 14px",borderRadius:7,fontSize:12,fontWeight:700,flexShrink:0}}>✓ 마지막 레슨</div>
        ) : (
          <button onClick={props.onNext} style={{background:"linear-gradient(135deg,"+t.ACC+","+t.PUR+")",color:"#fff",border:"none",padding:"5px 16px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0}}>다음 단계 →</button>
        )}
      </div>
    </div>
  );
}

/* ── PRACTICE TAB ───────────────────────── */
function PracticeTab(props) {
  var t = useT();
  var circuit = props.circuit;
  var setCircuit = props.setCircuit;
  var practiceResults = props.practiceResults || {};
  var onResult = props.onResult;
  var [activeProbId, setActiveProbId] = useState(null);
  var [showHint, setShowHint] = useState(false);
  var [result, setResult] = useState(null);
  var [domainFilter, setDomainFilter] = useState("전체");
  var [practiceSearch, setPracticeSearch] = useState("");
  var [practiceSort, setPracticeSort] = useState("default");
  var allDomains = DOMAIN_PROBLEMS.reduce(function(acc,p){if(!acc.find(function(d){return d.name===p.domain;}))acc.push({name:p.domain,icon:p.domainIcon});return acc;},[]);

  var activeProb = DOMAIN_PROBLEMS.find(function(p){return p.id===activeProbId;});
  var LEVEL_ORDER = {"입문":0,"초급":1,"중급":2,"고급":3};
  var filteredProblems = (function(){
    var list = DOMAIN_PROBLEMS.filter(function(p){
      if (domainFilter && domainFilter!=="전체" && p.domain!==domainFilter) return false;
      if (practiceSearch.trim()) return (p.title+p.scenario+p.domain).toLowerCase().indexOf(practiceSearch.trim().toLowerCase())>=0;
      return true;
    });
    if (practiceSort==="alpha") return list.slice().sort(function(a,b){return a.title.localeCompare(b.title,"ko");});
    if (practiceSort==="level") return list.slice().sort(function(a,b){return (LEVEL_ORDER[a.level]||0)-(LEVEL_ORDER[b.level]||0);});
    return list;
  })();

  function levelColor(lv) {
    if (lv==="입문") return t.GRN;
    if (lv==="초급") return t.ACC;
    if (lv==="중급") return t.AMB;
    return t.RED;
  }
  function domainColor(dm) {
    if (dm==="금융") return "#0EA5E9";
    if (dm==="보안") return "#A855F7";
    if (dm==="바이오") return "#10B981";
    if (dm==="물류") return "#F59E0B";
    if (dm==="에너지") return "#F97316";
    if (dm==="소재") return "#14B8A6";
    if (dm==="통신") return "#6366F1";
    return t.ACC;
  }

  function startProblem(prob) {
    setActiveProbId(prob.id);
    setShowHint(false);
    setResult(null);
    setCircuit(mkCkt());
  }

  function submit() {
    if (!activeProb) return;
    var userProbs = runSim(circuit).probs;
    var ansCircuit = buildCkt(activeProb.answerGates);
    var ansProbs = runSim(ansCircuit).probs;
    var diff = userProbs.reduce(function(s,p,i){return s+Math.abs(p-ansProbs[i]);},0);
    var score = Math.max(0, Math.round((1-diff/2)*100));
    setResult(score);
    onResult(activeProb.id, score);
  }

  if (activeProb) {
    var pr = practiceResults[activeProb.id];
    var prColor = pr&&pr.score!==undefined ? (pr.score>=80?t.GRN:pr.score>=50?t.AMB:t.RED) : t.T3;
    return (
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        <button onClick={function(){setActiveProbId(null);setResult(null);setShowHint(false);}} style={{display:"flex",alignItems:"center",gap:5,background:"transparent",border:"none",color:t.T3,fontSize:11,cursor:"pointer",padding:0,alignSelf:"flex-start"}}>← 목록으로</button>
        <div style={{border:"1px solid "+t.BDR,borderRadius:10,padding:"12px 14px",background:t.isDark?t.CARD:t.CARDH}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
            <span style={{background:t.isDark?t.BG:t.SURF,border:"1px solid "+t.BDR,borderRadius:7,padding:"2px 8px",fontSize:10,fontWeight:600,color:t.T2}}>{activeProb.domainIcon} {activeProb.domain}</span>
            <Tag color={levelColor(activeProb.level)}>{activeProb.level}</Tag>
            {pr&&pr.score!==undefined && (
              <span style={{marginLeft:"auto",background:prColor+"18",border:"1px solid "+prColor+"44",color:prColor,padding:"1px 8px",borderRadius:8,fontSize:10,fontWeight:700}}>{pr.score}/100점</span>
            )}
          </div>
          <div style={{color:t.T1,fontSize:13,fontWeight:700,marginBottom:6}}>{activeProb.title}</div>
          <div style={{color:t.T3,fontSize:11,lineHeight:1.5,marginBottom:8,fontStyle:"italic"}}>{activeProb.scenario}</div>
          <div style={{color:t.T2,fontSize:11.5,lineHeight:1.6}}>{activeProb.desc}</div>
        </div>
        <div style={{background:t.ACC+"0c",border:"1px solid "+t.ACC+"33",borderRadius:8,padding:"8px 12px",fontSize:11,color:t.T2,lineHeight:1.5}}>
          💡 오른쪽 회로 에디터에서 게이트를 배치한 뒤 아래 제출 버튼을 눌러보세요.
        </div>
        {showHint ? (
          <div style={{background:t.AMB+"0c",border:"1px solid "+t.AMB+"33",borderRadius:8,padding:"8px 12px",fontSize:11,color:t.T2,lineHeight:1.5}}>
            🔑 힌트: {activeProb.hint}
          </div>
        ) : (
          <button onClick={function(){setShowHint(true);}} style={{background:"transparent",border:"1px solid "+t.AMB+"55",color:t.AMB,borderRadius:8,padding:"6px 0",fontSize:11,fontWeight:600,cursor:"pointer"}}>💡 힌트 보기</button>
        )}
        {result !== null && (function(){
          var c = result>=80?t.GRN:result>=50?t.AMB:t.RED;
          var msg = result===100?"완벽합니다! 회로가 정확히 일치해요.":result>=80?"훌륭해요! 거의 정확합니다.":result>=50?"아쉬워요. 회로를 조금 더 수정해보세요.":"많이 다릅니다. 힌트를 참고해보세요.";
          return <div style={{borderRadius:8,padding:"10px 14px",background:c+"0f",border:"1px solid "+c+"44",color:c,fontSize:12,fontWeight:700,textAlign:"center"}}>{result}/100점 · {msg}</div>;
        })()}
        <button onClick={submit} style={{background:"linear-gradient(135deg,"+t.ACC+","+t.PUR+")",color:"#fff",border:"none",borderRadius:8,padding:"8px 0",fontSize:12,fontWeight:600,cursor:"pointer"}}>제출하기</button>
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
        <button onClick={function(){setDomainFilter("전체");}} style={{padding:"4px 11px",borderRadius:20,border:"1px solid "+(domainFilter==="전체"?t.ACC:t.BDR),background:domainFilter==="전체"?t.ACC+"22":"transparent",color:domainFilter==="전체"?t.ACC:t.T2,fontSize:11,cursor:"pointer",fontWeight:domainFilter==="전체"?700:400}}>전체</button>
        {allDomains.map(function(d){
          var on = domainFilter===d.name;
          var dc = domainColor(d.name);
          return <button key={d.name} onClick={function(){setDomainFilter(d.name);}} style={{padding:"4px 11px",borderRadius:20,border:"1px solid "+(on?dc:t.BDR),background:on?dc+"22":"transparent",color:on?dc:t.T2,fontSize:11,cursor:"pointer",fontWeight:on?700:400}}>{d.icon} {d.name}</button>;
        })}
      </div>
      <div style={{display:"flex",gap:5}}>
        <input value={practiceSearch} onChange={function(e){setPracticeSearch(e.target.value);}} placeholder="검색..." style={{flex:1,background:t.isDark?t.CARD:t.CARDH,border:"1px solid "+t.BDR,borderRadius:7,color:t.T1,padding:"5px 9px",fontSize:11.5,outline:"none"}}/>
        <select value={practiceSort} onChange={function(e){setPracticeSort(e.target.value);}} style={{background:t.isDark?t.CARD:t.CARDH,border:"1px solid "+t.BDR,borderRadius:7,color:t.T2,fontSize:11,padding:"5px 6px",outline:"none",cursor:"pointer"}}>
          <option value="default">기본순</option>
          <option value="level">난이도순</option>
          <option value="alpha">가나다순</option>
        </select>
      </div>
      {filteredProblems.map(function(prob){
        var pr = practiceResults[prob.id];
        var hasScore = pr && pr.score !== undefined;
        var scoreColor = hasScore ? (pr.score>=80?t.GRN:pr.score>=50?t.AMB:t.RED) : t.BDR;
        var dc = domainColor(prob.domain);
        return (
          <div key={prob.id} onClick={function(){startProblem(prob);}} style={{border:"1px solid "+dc+"55",borderRadius:10,overflow:"hidden",background:t.isDark?t.CARD:"transparent",transition:"border-color .18s",cursor:"pointer"}}>
            <div style={{display:"flex",flexDirection:"column",gap:6,padding:"10px 12px",userSelect:"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16,flexShrink:0}}>{prob.domainIcon}</span>
                <span style={{flex:1,color:t.T1,fontSize:12.5,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{prob.title}</span>
                <span style={{background:dc+"18",border:"1px solid "+dc+"55",color:dc,padding:"1px 8px",borderRadius:6,fontSize:9.5,fontWeight:700,flexShrink:0}}>{prob.domain}</span>
              </div>
              <p style={{color:t.T3,fontSize:10.5,lineHeight:1.5,margin:0,paddingLeft:24,fontStyle:"italic",display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{prob.scenario}</p>
              <div style={{display:"flex",alignItems:"center",gap:6,paddingLeft:24}}>
                <span style={{background:t.isDark?t.BG:t.SURF,border:"1px solid "+t.BDR,color:t.T3,padding:"1px 7px",borderRadius:6,fontSize:9.5,fontWeight:500}}>{prob.level}</span>
                <span style={{color:t.T3,fontSize:9.5,opacity:.4}}>·</span>
                {hasScore ? (
                  <span style={{background:scoreColor+"18",border:"1px solid "+scoreColor+"44",color:scoreColor,padding:"1px 8px",borderRadius:8,fontSize:9.5,fontWeight:700}}>{pr.score}/100점</span>
                ) : (
                  <span style={{color:t.T3,fontSize:9.5}}>미제출</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── REVIEW ITEM ────────────────────────── */
function ReviewItem(props) {
  var t = useT();
  var w = props.w;
  var stored = w.qr.wrongQA && w.qr.wrongQA.length > 0 ? w.qr.wrongQA : null;
  var [qa, setQa] = useState(stored);
  var [loading, setLoading] = useState(!stored);

  useEffect(function() {
    if (stored) return;
    var sys = "핵심 개념을 Q&A 형식으로 설명하는 튜터입니다. 반드시 JSON 배열만 출력하세요.";
    var prompt = '"' + w.tut.title + '" 커리큘럼의 "' + w.lesson.title + '" 레슨 핵심 개념을 Q&A 3개로 정리해줘. 형식: [{"q":"질문","answers":["핵심답변 하나"]}] answers는 단어·구문·짧은 문장 하나, 반드시 1개만.';
    callClaude([{role:"user",content:prompt}], sys).then(function(rep) {
      var m = rep.match(/\[[\s\S]*\]/);
      if (m) { try { setQa(JSON.parse(m[0])); } catch(e) {} }
      setLoading(false);
    });
  }, []);

  return (
    <div style={{border:"1px solid "+t.BDR,borderRadius:10,padding:"10px 12px",marginBottom:6,background:t.isDark?t.CARD:"transparent"}}>
      {loading ? (
        <div style={{color:t.T3,fontSize:11,textAlign:"center",padding:"8px 0"}}>불러오는 중…</div>
      ) : qa ? (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {qa.map(function(item,i){
            return (
              <div key={i}>
                <div style={{color:t.T1,fontSize:12,fontWeight:600,lineHeight:1.5,marginBottom:6}}><span style={{color:t.RED,marginRight:4}}>Q.</span>{item.q}</div>
                <div style={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:4}}>
                  <span style={{color:t.GRN,fontSize:11,fontWeight:700,marginRight:2}}>A.</span>
                  {(item.answers||[item.a]).map(function(ans,ai){
                    return <span key={ai} style={{background:t.GRN+"12",border:"1px solid "+t.GRN+"33",color:t.isDark?t.GRN:"#007755",padding:"2px 8px",borderRadius:6,fontSize:10.5,fontWeight:500}}>{ans}</span>;
                  })}
                </div>
              </div>
            );
          })}
          <div style={{color:t.T3,fontSize:9.5,marginTop:2}}>{w.tut.icon} {w.lesson.title}</div>
        </div>
      ) : (
        <div style={{color:t.T3,fontSize:11,textAlign:"center",padding:"8px 0"}}>내용을 불러오지 못했어요.</div>
      )}
    </div>
  );
}

/* ── TUTORIALS TAB ──────────────────────── */
function TutorialsTab(props) {
  var t = useT();
  var activeTutorial = props.activeTutorial;
  var activeLessonIdx = props.activeLessonIdx;
  var onStartLesson = props.onStartLesson;
  var onStartQuiz = props.onStartQuiz;
  var quizResults = props.quizResults || {};
  var circuit = props.circuit;
  var setCircuit = props.setCircuit;
  var practiceResults = props.practiceResults || {};
  var onPracticeResult = props.onPracticeResult;
  var [expandedId, setExpandedId] = useState(null);
  var [tab, setTab] = useState("lecture");
  var [tutSearch, setTutSearch] = useState("");
  var [tutSort, setTutSort] = useState("default");

  function levelColor(lv) {
    if (lv==="입문") return t.GRN;
    if (lv==="초급") return t.ACC;
    if (lv==="중급") return t.AMB;
    return t.RED;
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:7}}>
      <div style={{display:"flex",background:t.isDark?t.BG:t.CARDH,borderRadius:9,padding:2,gap:2}}>
        {[["lecture","📖","기초 학습"],["practice","🏭","도메인 실습"]].map(function(item){
          var isOn = tab===item[0];
          return (
            <button key={item[0]} onClick={function(){setTab(item[0]);}} style={{flex:1,padding:"5px 0",borderRadius:7,border:"none",fontSize:12,fontWeight:isOn?700:400,cursor:"pointer",background:isOn?t.SURF:"transparent",color:isOn?t.ACC:t.T2,transition:"all .18s"}}>
              {item[1]} {item[2]}
            </button>
          );
        })}
      </div>
      {tab==="practice" && (
        <PracticeTab circuit={circuit} setCircuit={setCircuit} practiceResults={practiceResults} onResult={onPracticeResult}/>
      )}
      {tab==="lecture" && <div style={{display:"flex",flexDirection:"column",gap:7}}>
      <div style={{display:"flex",gap:5,marginBottom:1,flexShrink:0}}>
        <input value={tutSearch} onChange={function(e){setTutSearch(e.target.value);}} placeholder="검색..." style={{flex:1,background:t.isDark?t.CARD:t.CARDH,border:"1px solid "+t.BDR,borderRadius:7,color:t.T1,padding:"5px 9px",fontSize:11.5,outline:"none"}}/>
        <select value={tutSort} onChange={function(e){setTutSort(e.target.value);}} style={{background:t.isDark?t.CARD:t.CARDH,border:"1px solid "+t.BDR,borderRadius:7,color:t.T2,fontSize:11,padding:"5px 6px",outline:"none",cursor:"pointer"}}>
          <option value="default">기본순</option>
          <option value="alpha">가나다순</option>
        </select>
      </div>
      {(tutSort==="alpha"?(tutSearch.trim()?TUTORIALS.filter(function(tt){return tt.title.toLowerCase().indexOf(tutSearch.trim().toLowerCase())>=0;}):TUTORIALS).slice().sort(function(a,b){return a.title.localeCompare(b.title,"ko");}):tutSearch.trim()?TUTORIALS.filter(function(tt){return tt.title.toLowerCase().indexOf(tutSearch.trim().toLowerCase())>=0;}):TUTORIALS).map(function(tut) {
        var lessons = TUTORIAL_LESSONS[tut.id] || [];
        var isExpanded = expandedId===tut.id;
        var isActive = activeTutorial && activeTutorial.id===tut.id;
        var doneCount = lessons.filter(function(l){return l.done;}).length;
        var pct = lessons.length ? Math.round(doneCount/lessons.length*100) : 0;
        var quizDone = lessons.map(function(_,idx){return tut.id+"_"+idx;}).filter(function(k){return quizResults[k]&&quizResults[k].attempted;});
        var quizScored = quizDone.filter(function(k){return quizResults[k].score!==null&&quizResults[k].score!==undefined;});
        var qTotalScore = quizScored.reduce(function(s,k){return s+quizResults[k].score;},0);
        var qTotalMax = quizScored.reduce(function(s,k){return s+quizResults[k].total;},0);
        return (
          <div key={tut.id} style={{border:"1px solid "+(isActive?t.PUR+"44":t.BDR),borderRadius:10,overflow:"hidden",background:isActive?t.PUR+"08":(t.isDark?t.CARD:"transparent"),transition:"border-color .18s"}}>
            <div onClick={function(){setExpandedId(isExpanded?null:tut.id);}} style={{display:"flex",flexDirection:"column",gap:6,padding:"10px 12px",cursor:"pointer",userSelect:"none"}}>
              {/* Row 1: icon + title + level + chevron */}
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16,flexShrink:0}}>{tut.icon}</span>
                <span style={{flex:1,color:isActive?t.PUR:t.T1,fontSize:12.5,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{tut.title}</span>
                <Tag color={levelColor(tut.level)}>{tut.level}</Tag>
                <span style={{color:t.T3,fontSize:11,flexShrink:0,display:"inline-block",transform:isExpanded?"rotate(180deg)":"rotate(0deg)",transition:"transform .2s"}}>▾</span>
              </div>
              {/* Row 2: description (always visible) */}
              <p style={{color:t.T2,fontSize:11,lineHeight:1.5,margin:0,paddingLeft:24,display:"-webkit-box",WebkitLineClamp:isExpanded?10:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{tut.desc}</p>
              {/* Row 3: progress bar + stats */}
              <div style={{display:"flex",alignItems:"center",gap:8,paddingLeft:24}}>
                <span style={{color:t.T3,fontSize:9.5,flexShrink:0}}>레슨</span>
                <div style={{flex:1,height:3,background:t.BDR,borderRadius:2,overflow:"hidden"}}>
                  <div style={{width:pct+"%",height:"100%",background:isActive?"linear-gradient(90deg,"+t.ACC+","+t.PUR+")":t.PUR+"88",borderRadius:2,transition:"width .5s"}}/>
                </div>
                <span style={{color:t.T3,fontSize:9.5,flexShrink:0}}>{doneCount}/{lessons.length}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:5,paddingLeft:24}}>
                <span style={{color:t.T3,fontSize:9.5,flexShrink:0}}>퀴즈</span>
                {lessons.map(function(_,idx){
                  var qr=quizResults[tut.id+"_"+idx];
                  var bg,title;
                  if(!qr||!qr.attempted){bg=t.BDR;title="미시도";}
                  else if(qr.score===null||qr.score===undefined){bg=t.AMB;title="채점 중";}
                  else if(qr.score/qr.total>=0.67){bg=t.GRN;title=qr.score+"/"+qr.total+"점";}
                  else{bg=t.RED;title=qr.score+"/"+qr.total+"점";}
                  return <div key={idx} title={title} style={{width:14,height:14,borderRadius:3,background:bg,flexShrink:0,transition:"background .3s"}}/>;
                })}
              </div>
            </div>
            {isExpanded && (
              <div style={{borderTop:"1px solid "+t.BDR,background:t.isDark?t.BG:t.CARDH}}>
                <div style={{padding:"8px 12px 4px",color:t.T2,fontSize:11,lineHeight:1.5}}>{tut.desc}</div>
                <div style={{padding:"4px 8px 8px"}}>
                  {lessons.map(function(lesson, idx) {
                    var isLessonActive = isActive && activeLessonIdx===idx;
                    var isNext = !lesson.done && (idx===0||lessons[idx-1].done);
                    return (
                      <div key={idx} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:7,background:isLessonActive?t.PUR+"18":"transparent",marginBottom:1}}>
                        <div style={{width:20,height:20,borderRadius:"50%",flexShrink:0,background:lesson.done?t.GRN+"22":isLessonActive?t.PUR+"22":"transparent",border:"1.5px solid "+(lesson.done?t.GRN:isNext?t.ACC:isLessonActive?t.PUR:t.T3),display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:lesson.done?t.GRN:isLessonActive?t.PUR:t.T3}}>
                          {lesson.done?"✓":idx+1}
                        </div>
                        <span style={{flex:1,fontSize:11.5,lineHeight:1.4,color:lesson.done?t.T2:isLessonActive?t.PUR:isNext?t.T1:t.T2,fontWeight:isLessonActive?600:400}}>{lesson.title}</span>
                        {(function(){
                          var lk=tut.id+"_"+idx;
                          var qr=quizResults[lk];
                          var hs=qr&&qr.score!==null&&qr.score!==undefined;
                          var p2=hs?qr.score/qr.total:0;
                          var c2=hs?(p2===1?t.GRN:p2>=0.67?t.AMB:t.RED):t.AMB;
                          var canQuiz=(lesson.done||isLessonActive)&&onStartQuiz;
                          return (
                            <div key="qzone" style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                              {qr&&qr.attempted&&(
                                <span style={{background:c2+"18",border:"1px solid "+c2+"44",color:c2,padding:"1px 7px",borderRadius:8,fontSize:9.5,fontWeight:700,whiteSpace:"nowrap"}}>
                                  {hs?qr.score+"/"+qr.total+"점":"채점 중…"}
                                </span>
                              )}
                              {canQuiz&&(
                                <button onClick={function(e){e.stopPropagation();onStartQuiz(tut,lesson,idx);}} style={{background:qr&&qr.attempted?t.isDark?t.CARD:t.CARDH:"transparent",border:"1px solid "+(qr&&qr.attempted?t.BDR:t.AMB+"66"),color:qr&&qr.attempted?t.T3:t.AMB,padding:"1px 8px",borderRadius:8,fontSize:9.5,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",transition:"all .15s"}}>
                                  📝 {qr&&qr.attempted?"재시험":"퀴즈"}
                                </button>
                              )}
                            </div>
                          );
                        })()}
                        {isNext && !isLessonActive && (
                          <button onClick={function(){onStartLesson(tut,lesson,idx);}} style={{background:"linear-gradient(135deg,"+t.ACC+","+t.PUR+")",color:"#fff",border:"none",padding:"3px 9px",borderRadius:6,fontSize:10.5,fontWeight:600,cursor:"pointer",flexShrink:0}}>시작 →</button>
                        )}
                        {isLessonActive && <span style={{color:t.PUR,fontSize:10,fontWeight:600,flexShrink:0}}>진행 중</span>}
                      </div>
                    );
                  })}
                </div>
                <div style={{padding:"0 8px 10px"}}>
                  <button onClick={function(){
                    var targetIdx = (isActive && activeLessonIdx!==null) ? activeLessonIdx : Math.max(lessons.findIndex(function(l){return !l.done;}),0);
                    onStartLesson(tut,lessons[targetIdx],targetIdx);
                  }} style={{width:"100%",padding:"7px",borderRadius:8,fontSize:11.5,fontWeight:600,cursor:"pointer",background:isActive?t.PUR+"20":"linear-gradient(135deg,"+t.ACC+"22,"+t.PUR+"22)",border:isActive?"1px solid "+t.PUR+"55":"1px dashed "+t.ACC+"55",color:isActive?t.PUR:t.ACC,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    {isActive?"⟳ 현재 레슨 다시 시작":"✦ AI 가이드 시작"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {(function(){
        var wrongs = [];
        TUTORIALS.forEach(function(tut){
          var lessons = TUTORIAL_LESSONS[tut.id]||[];
          lessons.forEach(function(lesson,idx){
            var qr = quizResults[tut.id+"_"+idx];
            if(qr&&qr.attempted&&qr.score!==null&&qr.score!==undefined&&qr.score/qr.total<0.67){
              wrongs.push({tut:tut,lesson:lesson,idx:idx,qr:qr});
            }
          });
        });
        if(!wrongs.length) return null;
        var recent = wrongs.slice().sort(function(a,b){return (b.qr.ts||0)-(a.qr.ts||0);}).slice(0,3);
        return (
          <div style={{marginTop:12}}>
            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:8}}>
              <span style={{fontSize:11}}>📕</span>
              <span style={{color:t.T2,fontSize:11,fontWeight:600}}>오답 복습</span>
              <span style={{color:t.T3,fontSize:10,marginLeft:2}}>최신 {recent.length}개</span>
            </div>
            {recent.map(function(w,i){ return <ReviewItem key={i} w={w}/>; })}
          </div>
        );
      })()}
      </div>}
    </div>
  );
}


/* ── COLLAB Q&A DATA ────────────────────── */
var INIT_POSTS = [
  {
    id:1, author:"김민준", av:"🧑‍💻", time:"2시간 전",
    question:"CNOT 게이트를 q[1]을 컨트롤로 설정하면 Bell 상태가 다르게 나오나요? 시뮬레이터 결과가 달라지는 것 같아서요.",
    tags:["CNOT","Bell 상태"],
    answers:[
      {id:11, author:"이서연", av:"👩‍🔬", time:"1시간 전", text:"네, 컨트롤 큐비트가 달라지면 생성되는 Bell 상태가 달라집니다. q[0] 컨트롤이면 |Φ+⟩ = (|00⟩+|11⟩)/√2가 나오지만, q[1] 컨트롤로 하면 큐비트 순서가 바뀌어 나와요. 오른쪽 시뮬레이터에서 직접 비교해보세요!", upvotes:3},
    ],
    upvotes:5,
  },
  {
    id:2, author:"이서연", av:"👩‍🔬", time:"1시간 전",
    question:"Hadamard 게이트를 두 번 연속 적용하면 원래 상태로 돌아온다고 하는데, 시뮬레이터로 확인하는 방법이 있을까요?",
    tags:["Hadamard","게이트"],
    answers:[],
    upvotes:3,
  },
  {
    id:3, author:"박지호", av:"👨‍🎓", time:"30분 전",
    question:"GHZ 상태와 Bell 상태의 가장 큰 실용적 차이점이 뭔가요? 양자 암호 응용에서 어떻게 다른지 알고 싶어요.",
    tags:["GHZ","얽힘","응용"],
    answers:[],
    upvotes:2,
  },
];

/* ── COLLAB Q&A TAB ─────────────────────── */

var TEAM_MEMOS = [
  { id:"tm1", author:"김민준", av:"🧑‍💻", time:"1시간 전", type:"note",             content:"Bell 상태 구현할 때 H → CNOT 순서가 핵심! 순서 바꾸면 다른 상태 나옴. 컨트롤 큐비트에 먼저 H 적용하는 것 잊지 말기.", upvotes:3, comments:[] },
  { id:"tm2", author:"이서연", av:"👩‍🔬", time:"30분 전",  type:"circuit-analysis", content:"GHZ = 3큐비트 얽힘 (|000⟩+|111⟩)/√2. 한 큐비트 측정하면 나머지 2개가 동시에 결정됨. 비국소성의 극단적 예시.", upvotes:5, comments:[] },
  { id:"tm3", author:"박지호", av:"👨‍🎓", time:"15분 전",  type:"summary",          content:"Grover 핵심: 오라클로 목표 위상 뒤집기 → 디퓨저로 진폭 증폭 반복. √N번 반복으로 O(√N) 검색 달성.", upvotes:2, comments:[] },
];

function CollabTab(props) {
  var t = useT();
  var onSendToChat = props.onSendToChat;
  var onStartSourceSearch = props.onStartSourceSearch;
  var sharedNotes = props.sharedNotes || [];
  var [collabView, setCollabView] = useState("qa");  /* "qa" | "memo" */
  var [posts, setPosts] = useState(INIT_POSTS);
  var [detailId, setDetailId] = useState(null);
  var [detailNote, setDetailNote] = useState(null);
  var [asking, setAsking] = useState(false);
  var [qText, setQText] = useState("");
  var [qTags, setQTags] = useState("");
  var [replyText, setReplyText] = useState("");
  var [likedIds, setLikedIds] = useState([]);
  var [myMemo, setMyMemo] = useState("");
  var [qaSearch, setQaSearch] = useState("");
  var [qaSort, setQaSort] = useState("newest");
  var [memoSearch, setMemoSearch] = useState("");
  var [memoSort, setMemoSort] = useState("newest");
  var [memoComments, setMemoComments] = useState({});
  var [memoLikedIds, setMemoLikedIds] = useState([]);
  var [noteReplyText, setNoteReplyText] = useState("");

  var post = posts.find(function(p){return p.id===detailId;});

  function submitQuestion() {
    if (!qText.trim()) return;
    var tagArr = qTags.split(/[,\s]+/).filter(function(x){return x.trim();});
    var np = {id:Date.now(),author:"홍길동",av:"😊",time:"방금",question:qText,tags:tagArr,answers:[],upvotes:0};
    setPosts(function(p){return [np].concat(p);});
    setQText(""); setQTags(""); setAsking(false);
    setDetailId(np.id);
  }

  function submitAnswer() {
    if (!replyText.trim()||!post) return;
    var ans = {id:Date.now(),author:"홍길동",av:"😊",time:"방금",text:replyText,upvotes:0};
    setPosts(function(p){return p.map(function(pp){
      if (pp.id!==detailId) return pp;
      return {id:pp.id,author:pp.author,av:pp.av,time:pp.time,question:pp.question,tags:pp.tags,upvotes:pp.upvotes,answers:pp.answers.concat([ans])};
    });});
    setReplyText("");
  }

  function toggleLike(pid) {
    setLikedIds(function(arr){
      var has = arr.indexOf(pid)>=0;
      return has ? arr.filter(function(x){return x!==pid;}) : arr.concat([pid]);
    });
  }

  /* ── Note detail page ── */
  if (detailNote) {
    var TYPE_META_D={"note":{label:"직접 메모",icon:"✏️",clr:t.GRN},"ai-msg":{label:"AI 응답",icon:"🔖",clr:t.PUR},"summary":{label:"대화 요약",icon:"📝",clr:t.ACC},"glossary":{label:"용어 정리",icon:"📖",clr:t.AMB},"mindmap":{label:"마인드맵",icon:"🗺️",clr:t.PUR},"circuit-analysis":{label:"회로 분석",icon:"🔬",clr:t.GRN},"circuit-compare":{label:"회로 비교",icon:"📊",clr:t.PUR},"experiment":{label:"실험 보고서",icon:"📋",clr:t.RED}};
    var dn=detailNote; var dmm=TYPE_META_D[dn.type]||TYPE_META_D["note"];
    return (
      <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,flexShrink:0}}>
          <button onClick={function(){setDetailNote(null);}} style={{background:"transparent",border:"none",color:t.ACC,fontSize:13,cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:4,fontWeight:600}}>← 뒤로</button>
        </div>
        <div style={{background:t.isDark?t.CARD:t.CARDH,border:"1px solid "+t.BDR,borderRadius:9,padding:12,marginBottom:10,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:7}}>
            <span style={{fontSize:16}}>{dn.av||"😊"}</span>
            <span style={{color:t.ACC,fontWeight:600,fontSize:11.5}}>{dn.author||"나"}</span>
            <span style={{color:t.T3,fontSize:10}}>{dn.time}</span>
          </div>
          <p style={{color:t.T1,fontSize:12,lineHeight:1.7,margin:"0 0 8px 0"}}>{dn.content.replace(/\*\*/g,"").replace(/#+\s/g,"").trim()}</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
            <span style={{background:dmm.clr+"15",border:"1px solid "+dmm.clr+"33",color:dmm.clr,padding:"1px 7px",borderRadius:10,fontSize:10,fontWeight:600}}>{dmm.icon} {dmm.label}</span>
          </div>
          {onSendToChat && (
            <button onClick={function(){onSendToChat(dn.content+" — 이에 대해 더 자세히 설명해줘");}} style={{width:"100%",padding:"6px",background:"linear-gradient(135deg,"+t.ACC+"22,"+t.PUR+"22)",border:"1px dashed "+t.ACC+"55",borderRadius:7,color:t.ACC,fontSize:11.5,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              ✦ AI에게 물어보기
            </button>
          )}
        </div>
        {/* Comments */}
        <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
          {(memoComments[dn.id]||[]).length===0 ? (
            <div style={{color:t.T3,fontSize:11.5,textAlign:"center",padding:"20px 0"}}>아직 코멘트가 없어요. 첫 코멘트를 달아보세요!</div>
          ) : (memoComments[dn.id]||[]).map(function(c,i){
            return (
              <div key={i} style={{background:t.isDark?t.CARD:t.CARDH,border:"1px solid "+t.BDR,borderRadius:9,padding:"10px 12px"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                  <span style={{fontSize:15}}>{c.av}</span>
                  <span style={{color:t.PUR,fontWeight:600,fontSize:11.5}}>{c.author}</span>
                  <span style={{color:t.T3,fontSize:10}}>{c.time}</span>
                </div>
                <p style={{color:t.T1,fontSize:11.5,lineHeight:1.7,margin:0}}>{c.text}</p>
              </div>
            );
          })}
        </div>
        {/* Reply form */}
        <div style={{flexShrink:0}}>
          <textarea value={noteReplyText} onChange={function(e){setNoteReplyText(e.target.value);}} placeholder="코멘트를 작성하세요..." rows={3} style={{width:"100%",background:t.SURF,border:"1px solid "+t.BDRH,borderRadius:8,color:t.T1,padding:"8px 10px",fontSize:11.5,outline:"none",resize:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:6}}/>
          <button onClick={function(){
            if (!noteReplyText.trim()) return;
            var key = dn.id;
            var c = {author:"홍길동",av:"😊",time:"방금",text:noteReplyText};
            setMemoComments(function(prev){var updated=Object.assign({},prev);updated[key]=(updated[key]||[]).concat([c]);return updated;});
            setNoteReplyText("");
          }} disabled={!noteReplyText.trim()} style={{width:"100%",padding:"7px",background:noteReplyText.trim()?"linear-gradient(135deg,"+t.ACC+","+t.PUR+")":t.BDR,border:"none",borderRadius:8,color:noteReplyText.trim()?"#fff":t.T3,fontSize:12,fontWeight:600,cursor:"pointer"}}>
            코멘트 등록
          </button>
        </div>
      </div>
    );
  }

  /* ── Detail page ── */
  if (detailId && post) {
    return (
      <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,flexShrink:0}}>
          <button onClick={function(){setDetailId(null);setReplyText("");}} style={{background:"transparent",border:"none",color:t.ACC,fontSize:13,cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:4,fontWeight:600}}>
            ← 뒤로
          </button>
        </div>
        {/* Question */}
        <div style={{background:t.isDark?t.CARD:t.CARDH,border:"1px solid "+t.BDR,borderRadius:9,padding:12,marginBottom:10,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:7}}>
            <span style={{fontSize:16}}>{post.av}</span>
            <span style={{color:t.ACC,fontWeight:600,fontSize:11.5}}>{post.author}</span>
            <span style={{color:t.T3,fontSize:10}}>{post.time}</span>
          </div>
          <p style={{color:t.T1,fontSize:12,lineHeight:1.7,margin:"0 0 8px 0"}}>{post.question}</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
            {post.tags.map(function(tg){return <span key={tg} style={{background:t.ACC+"15",border:"1px solid "+t.ACC+"33",color:t.ACC,padding:"1px 7px",borderRadius:10,fontSize:10,fontWeight:600}}>#{tg}</span>;})}
          </div>
          {onSendToChat && (
            <button onClick={function(){onSendToChat(post.question);}} style={{width:"100%",padding:"6px",background:"linear-gradient(135deg,"+t.ACC+"22,"+t.PUR+"22)",border:"1px dashed "+t.ACC+"55",borderRadius:7,color:t.ACC,fontSize:11.5,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              ✦ AI에게 물어보기
            </button>
          )}
        </div>
        {/* Answers */}
        <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
          {post.answers.length===0 ? (
            <div style={{color:t.T3,fontSize:11.5,textAlign:"center",padding:"20px 0"}}>아직 코멘트가 없어요. 첫 코멘트를 달아보세요!</div>
          ) : post.answers.map(function(ans,i){
            return (
              <div key={ans.id||i} style={{background:t.isDark?t.CARD:t.CARDH,border:"1px solid "+t.BDR,borderRadius:9,padding:"10px 12px"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                  <span style={{fontSize:15}}>{ans.av}</span>
                  <span style={{color:t.PUR,fontWeight:600,fontSize:11.5}}>{ans.author}</span>
                  <span style={{color:t.T3,fontSize:10}}>{ans.time}</span>
                </div>
                <p style={{color:t.T1,fontSize:11.5,lineHeight:1.7,margin:"0 0 6px 0"}}>{ans.text}</p>
                <div style={{color:t.T3,fontSize:10}}>↑ {ans.upvotes}</div>
              </div>
            );
          })}
        </div>
        {/* Reply form */}
        <div style={{flexShrink:0}}>
          <textarea value={replyText} onChange={function(e){setReplyText(e.target.value);}} placeholder="코멘트를 작성하세요..." rows={3} style={{width:"100%",background:t.SURF,border:"1px solid "+t.BDRH,borderRadius:8,color:t.T1,padding:"8px 10px",fontSize:11.5,outline:"none",resize:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:6}}/>
          <button onClick={submitAnswer} disabled={!replyText.trim()} style={{width:"100%",padding:"7px",background:replyText.trim()?"linear-gradient(135deg,"+t.ACC+","+t.PUR+")":t.BDR,border:"none",borderRadius:8,color:replyText.trim()?"#fff":t.T3,fontSize:12,fontWeight:600,cursor:"pointer"}}>
            코멘트 등록
          </button>
        </div>
      </div>
    );
  }

  /* ── Memo page ── */
  if (collabView==="memo") {
    return (
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {/* Sub-tab toggle */}
        <div style={{display:"flex",background:t.isDark?t.BG:t.CARDH,borderRadius:9,padding:2,gap:2,flexShrink:0}}>
          <button onClick={function(){setCollabView("qa");}} style={{flex:1,padding:"5px 0",borderRadius:7,border:"none",fontSize:12,fontWeight:collabView==="qa"?700:400,cursor:"pointer",background:collabView==="qa"?t.SURF:"transparent",color:collabView==="qa"?t.PUR:t.T2,transition:"all .18s"}}>💬 질문</button>
          <button onClick={function(){setCollabView("memo");}} style={{flex:1,padding:"5px 0",borderRadius:7,border:"none",fontSize:12,fontWeight:collabView==="memo"?700:400,cursor:"pointer",background:collabView==="memo"?t.SURF:"transparent",color:collabView==="memo"?t.PUR:t.T2,transition:"all .18s"}}>📝 노트</button>
        </div>
        {/* Team memos only — personal writing is in the right panel */}
        <div style={{display:"flex",gap:5}}>
          <input value={memoSearch} onChange={function(e){setMemoSearch(e.target.value);}} placeholder="검색..." style={{flex:1,background:t.isDark?t.CARD:t.CARDH,border:"1px solid "+t.BDR,borderRadius:7,color:t.T1,padding:"5px 9px",fontSize:11.5,outline:"none"}}/>
          <select value={memoSort} onChange={function(e){setMemoSort(e.target.value);}} style={{background:t.isDark?t.CARD:t.CARDH,border:"1px solid "+t.BDR,borderRadius:7,color:t.T2,fontSize:11,padding:"5px 6px",outline:"none",cursor:"pointer"}}>
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
          </select>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {(function(){
            var TYPE_META={"note":{label:"직접 메모",icon:"✏️",clr:t.GRN},"ai-msg":{label:"AI 응답",icon:"🔖",clr:t.PUR},"summary":{label:"대화 요약",icon:"📝",clr:t.ACC},"glossary":{label:"용어 정리",icon:"📖",clr:t.AMB},"mindmap":{label:"마인드맵",icon:"🗺️",clr:t.PUR},"circuit-analysis":{label:"회로 분석",icon:"🔬",clr:t.GRN},"circuit-compare":{label:"회로 비교",icon:"📊",clr:t.PUR},"experiment":{label:"실험 보고서",icon:"📋",clr:t.RED}};
            var allMemos = (memoSort==="oldest"?sharedNotes.slice().reverse():sharedNotes).filter(function(m){return !memoSearch.trim()||(m.content+""+(m.title||"")).toLowerCase().indexOf(memoSearch.trim().toLowerCase())>=0;});
            var myCards = allMemos.map(function(m,i){
              var mm=TYPE_META[m.type]||TYPE_META["ai-msg"];
              return (
                <div key={m.id||i} onClick={function(){setDetailNote(m);}} style={{background:t.isDark?t.CARD:"transparent",border:"1px solid "+t.BDR,borderRadius:9,padding:"10px 12px",cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                    <span style={{fontSize:14}}>😊</span>
                    <span style={{color:t.T1,fontWeight:600,fontSize:11}}>나</span>
                    <span style={{color:t.T3,fontSize:10,marginLeft:"auto"}}>{m.time}</span>
                  </div>
                  <p style={{color:t.T1,fontSize:11.5,lineHeight:1.5,margin:"0 0 6px 0",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{m.content.replace(/\*\*/g,"").replace(/#+\s/g,"").trim()}</p>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{background:mm.clr+"12",border:"1px solid "+mm.clr+"33",color:mm.clr,padding:"1px 6px",borderRadius:8,fontSize:9.5,fontWeight:600}}>{mm.icon} {mm.label}</span>
                    <span style={{flex:1}}/>
                    <span style={{color:t.T3,fontSize:10}}>💬{(memoComments[m.id]||[]).length}</span>
                    <span style={{color:t.T3,fontSize:12}}>›</span>
                  </div>
                </div>
              );
            });
            var teamCards = (memoSort==="oldest"?TEAM_MEMOS.slice().reverse():TEAM_MEMOS).filter(function(m){return !memoSearch.trim()||m.content.toLowerCase().indexOf(memoSearch.trim().toLowerCase())>=0;}).map(function(m,i){
              var mm=m.type?TYPE_META[m.type]:null;
              return (
                <div key={i} onClick={function(){setDetailNote(m);}} style={{background:t.isDark?t.CARD:"transparent",border:"1px solid "+t.BDR,borderRadius:9,padding:"10px 12px",cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                    <span style={{fontSize:14}}>{m.av}</span>
                    <span style={{color:t.T1,fontWeight:600,fontSize:11}}>{m.author}</span>
                    <span style={{color:t.T3,fontSize:10,marginLeft:"auto"}}>{m.time}</span>
                  </div>
                  <p style={{color:t.T1,fontSize:11.5,lineHeight:1.5,margin:"0 0 6px 0",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{m.content}</p>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    {mm && <span style={{background:mm.clr+"12",border:"1px solid "+mm.clr+"33",color:mm.clr,padding:"1px 6px",borderRadius:8,fontSize:9.5,fontWeight:600}}>{mm.icon} {mm.label}</span>}
                    <span style={{flex:1}}/>
                    <span style={{color:t.T3,fontSize:10}}>↑{m.upvotes||0}</span>
                    <span style={{color:t.T3,fontSize:10}}>💬{(memoComments[m.id]||[]).length}</span>
                    <span style={{color:t.T3,fontSize:12}}>›</span>
                  </div>
                </div>
              );
            });
            return myCards.concat(teamCards);
          })()}
          {sharedNotes.length===0 && TEAM_MEMOS.length===0 && (
            <div style={{color:t.T3,fontSize:11.5,textAlign:"center",padding:"20px 0"}}>공유된 노트가 없어요</div>
          )}
        </div>
      </div>
    );
  }

  /* ── List page ── */
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {/* Sub-tab toggle */}
      <div style={{display:"flex",background:t.isDark?t.BG:t.CARDH,borderRadius:9,padding:2,gap:2}}>
        <button onClick={function(){setCollabView("qa");}} style={{flex:1,padding:"5px 0",borderRadius:7,border:"none",fontSize:12,fontWeight:collabView==="qa"?700:400,cursor:"pointer",background:collabView==="qa"?t.SURF:"transparent",color:collabView==="qa"?t.PUR:t.T2,transition:"all .18s"}}>💬 질문</button>
        <button onClick={function(){setCollabView("memo");}} style={{flex:1,padding:"5px 0",borderRadius:7,border:"none",fontSize:12,fontWeight:collabView==="memo"?700:400,cursor:"pointer",background:collabView==="memo"?t.SURF:"transparent",color:collabView==="memo"?t.PUR:t.T2,transition:"all .18s"}}>📝 노트</button>
      </div>
      {/* Ask button */}
      <button onClick={function(){setAsking(!asking);}} style={{background:t.PUR+"12",border:"1px dashed "+t.PUR+"55",color:t.PUR,padding:"8px 12px",borderRadius:9,fontSize:12,cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
        {asking ? "취소" : "+ 질문하기"}
      </button>
      {/* Question form */}
      {asking && (
        <div style={{background:t.isDark?t.CARD:t.CARDH,border:"1px solid "+t.BDRH,borderRadius:9,padding:11}}>
          <textarea value={qText} onChange={function(e){setQText(e.target.value);}} placeholder="개념이나 회로에 대해 팀원들에게 질문해보세요..." rows={4} style={{background:t.SURF,border:"1px solid "+t.BDR,borderRadius:6,color:t.T1,padding:"6px 9px",fontSize:11.5,outline:"none",width:"100%",boxSizing:"border-box",marginBottom:7,resize:"vertical",fontFamily:"inherit"}}/>
          <input value={qTags} onChange={function(e){setQTags(e.target.value);}} placeholder="태그 (쉼표 구분: Bell, CNOT)" style={{background:t.SURF,border:"1px solid "+t.BDR,borderRadius:6,color:t.T1,padding:"5px 9px",fontSize:11,outline:"none",width:"100%",boxSizing:"border-box",marginBottom:7}}/>
          <button onClick={submitQuestion} disabled={!qText.trim()} style={{width:"100%",padding:"6px",background:qText.trim()?"linear-gradient(135deg,"+t.ACC+","+t.PUR+")":t.BDR,border:"none",borderRadius:7,color:qText.trim()?"#fff":t.T3,fontSize:12,fontWeight:600,cursor:"pointer"}}>
            질문 올리기
          </button>
        </div>
      )}
      {/* Search + Sort */}
      <div style={{display:"flex",gap:5,flexShrink:0}}>
        <input value={qaSearch} onChange={function(e){setQaSearch(e.target.value);}} placeholder="검색..." style={{flex:1,background:t.isDark?t.CARD:t.CARDH,border:"1px solid "+t.BDR,borderRadius:7,color:t.T1,padding:"5px 9px",fontSize:11.5,outline:"none"}}/>
        <select value={qaSort} onChange={function(e){setQaSort(e.target.value);}} style={{background:t.isDark?t.CARD:t.CARDH,border:"1px solid "+t.BDR,borderRadius:7,color:t.T2,fontSize:11,padding:"5px 6px",outline:"none",cursor:"pointer"}}>
          <option value="newest">최신순</option>
          <option value="popular">인기순</option>
          <option value="oldest">오래된순</option>
        </select>
      </div>
      {/* Post list */}
      {(function(){
        var q = qaSearch.trim().toLowerCase();
        var list = q ? posts.filter(function(p){return (p.question+" "+p.tags.join(" ")).toLowerCase().indexOf(q)>=0;}) : posts.slice();
        if (qaSort==="popular") list = list.slice().sort(function(a,b){return b.upvotes-a.upvotes;});
        else if (qaSort==="oldest") list = list.slice().reverse();
        return list;
      })().map(function(p) {
        var isLiked = likedIds.indexOf(p.id)>=0;
        return (
          <div key={p.id} onClick={function(){setDetailId(p.id);}} style={{background:t.isDark?t.CARD:"transparent",border:"1px solid "+t.BDR,borderRadius:9,padding:"10px 12px",cursor:"pointer",transition:"all .18s"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
              <span style={{fontSize:14}}>{p.av}</span>
              <span style={{color:t.T1,fontWeight:600,fontSize:11}}>{p.author}</span>
              <span style={{color:t.T3,fontSize:10,marginLeft:"auto"}}>{p.time}</span>
            </div>
            <p style={{color:t.T1,fontSize:11.5,lineHeight:1.5,margin:"0 0 6px 0",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{p.question}</p>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{display:"flex",gap:4,flex:1,flexWrap:"wrap"}}>
                {p.tags.slice(0,2).map(function(tg){return <span key={tg} style={{background:t.PUR+"12",color:t.PUR,padding:"1px 6px",borderRadius:8,fontSize:9.5,fontWeight:600}}>#{tg}</span>;})}
              </div>
              <span style={{color:t.T3,fontSize:10}}>↑{p.upvotes+(isLiked?1:0)}</span>
              <span style={{color:t.T3,fontSize:10}}>💬{p.answers.length}</span>
              <span style={{color:t.T3,fontSize:12}}>›</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── LEFT PANEL ─────────────────────────── */
function LeftPanel(props) {
  var t = useT();
  var activeSources = props.activeSources || [];
  var toggleSource = props.toggleSource;
  var activeTutorial = props.activeTutorial;
  var activeLessonIdx = props.activeLessonIdx;
  var onStartLesson = props.onStartLesson;
  var onSendToChat = props.onSendToChat;
  var onStartSourceSearch = props.onStartSourceSearch;
  var sharedNotes = props.sharedNotes || [];
  var onShareNote = props.onShareNote || function(){};
  var sources = props.sources || [];
  var setSources = props.setSources || function(){};
  var quizResults = props.quizResults || {};
  var onStartQuiz = props.onStartQuiz;
  var circuit = props.circuit;
  var setCircuit = props.setCircuit;
  var practiceResults = props.practiceResults || {};
  var onPracticeResult = props.onPracticeResult;
  var [tab, setTab] = useState("sources");
  var [srcSubTab, setSrcSubTab] = useState("doc");
  var [newTitle, setNewTitle] = useState("");
  var [newText, setNewText] = useState("");
  var [newUrl, setNewUrl] = useState("");
  var [srcAddMode, setSrcAddMode] = useState(null);
  var [srcPage, setSrcPage] = useState(null);
  var [srcSearch, setSrcSearch] = useState("");
  var [srcSort, setSrcSort] = useState("newest");
  var [newTags, setNewTags] = useState("");
  var srcPageChecked = srcPage ? activeSources.some(function(a){return a.id===srcPage.id;}) : false;
  var fileInputRef = useRef(null);
  var circFileInputRef = useRef(null);

  function addCircuitFromText() {
    if (!newTitle.trim()||!newText.trim()) return;
    var rows = null;
    try { rows = codeToCircuit(newText); } catch(ex) { rows = null; }
    var now=new Date().toISOString().slice(0,10); var s = {id:Date.now(),type:"ref-circuit",icon:"⚛",title:newTitle,content:newText,circuit:rows||mkCkt(),author:"직접 작성",av:"📝",addedAt:now,tags:newTags.trim()?newTags.split(/[,\s]+/).map(function(t){return t.trim();}).filter(Boolean):[]};
    setSources(function(p){return p.concat([s]);});
    toggleSource(s);
    setNewTags(""); setNewTitle(""); setNewText(""); setSrcAddMode(null);
  }

  function addCircuitFromUrl() {
    if (!newUrl.trim()) return;
    var host = newUrl.replace(/https?:\/\//,"").split("/")[0];
    var title = newTitle.trim() || host;
    var now=new Date().toISOString().slice(0,10); var s = {id:Date.now(),type:"ref-circuit",icon:"🔗",title:title,content:"링크: "+newUrl,url:newUrl,author:host,av:"🔗",addedAt:now,tags:newTags.trim()?newTags.split(/[,\s]+/).map(function(t){return t.trim();}).filter(Boolean):[]};
    setSources(function(p){return p.concat([s]);});
    toggleSource(s);
    setNewTags(""); setNewUrl(""); setNewTitle(""); setSrcAddMode(null);
  }

  function handleCircuitFileChange(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      var content = ev.target.result || "";
      var title = file.name.replace(/\.[^.]+$/, "");
      var rows = null;
      try { rows = codeToCircuit(content); } catch(ex) { rows = null; }
      var now=new Date().toISOString().slice(0,10); var s = {id:Date.now(),type:"ref-circuit",icon:"⚛",title:title,content:content.slice(0,5000),circuit:rows||mkCkt(),author:"파일",av:"📁",addedAt:now,tags:[]};
      setSources(function(p){return p.concat([s]);});
      toggleSource(s);
      setSrcAddMode(null);
    };
    reader.readAsText(file, "utf-8");
  }

  function addFromText() {
    if (!newTitle.trim()||!newText.trim()) return;
    var now=new Date().toISOString().slice(0,10); var s = {id:Date.now(),type:"doc",icon:"📄",title:newTitle,content:newText,author:"직접 작성",av:"📝",addedAt:now,tags:newTags.trim()?newTags.split(/[,\s]+/).map(function(t){return t.trim();}).filter(Boolean):[]};
    setSources(function(p){return p.concat([s]);});
    toggleSource(s);
    setNewTags(""); setNewTitle(""); setNewText(""); setSrcAddMode(null);
  }

  function addFromUrl() {
    if (!newUrl.trim()) return;
    var host = newUrl.replace(/https?:\/\//,"").split("/")[0];
    var title = newTitle.trim() || host;
    var now=new Date().toISOString().slice(0,10); var s = {id:Date.now(),type:"doc",icon:"🔗",title:title,content:"링크: "+newUrl,url:newUrl,author:host,av:"🔗",addedAt:now,tags:newTags.trim()?newTags.split(/[,\s]+/).map(function(t){return t.trim();}).filter(Boolean):[]};
    setSources(function(p){return p.concat([s]);});
    toggleSource(s);
    setNewTags(""); setNewUrl(""); setNewTitle(""); setSrcAddMode(null);
  }

  function handleFileChange(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      var content = ev.target.result || "";
      var title = file.name.replace(/\.[^.]+$/, "");
      var icon = file.name.match(/\.pdf$/i) ? "📕" : "📄";
      var now=new Date().toISOString().slice(0,10); var s = {id:Date.now(),type:"doc",icon:icon,title:title,content:content.slice(0,20000),author:"홍길동",av:"📁",addedAt:now,tags:[]};
      setSources(function(p){return p.concat([s]);});
      toggleSource(s);
      setSrcAddMode(null);
    };
    reader.readAsText(file, "utf-8");
  }

  /* Pre-compute source groups with search + sort */
  function applySearchSort(list) {
    var q = srcSearch.trim().toLowerCase();
    var filtered = q ? list.filter(function(s){ return (s.title+""+(s.content||"")+(s.author||"")+((s.tags||[]).join(" "))).toLowerCase().indexOf(q)>=0; }) : list;
    return filtered.slice().sort(function(a,b){
      if (srcSort==="alpha") return a.title.localeCompare(b.title,"ko");
      if (srcSort==="oldest") return (a.id||0)-(b.id||0);
      return (b.id||0)-(a.id||0);
    });
  }
  var docs = applySearchSort(sources.filter(function(s){return s.type==="doc";}));
  var refC = applySearchSort(sources.filter(function(s){return s.type==="ref-circuit";}));
  var teamC = sources.filter(function(s){return s.type==="team-circuit";});

  /* renderSrc — card for each source item */
  function renderSrc(s) {
    var isChecked = activeSources.some(function(a){return a.id===s.id;});
    var isCircuit = s.type==="ref-circuit";
    var gateCount = isCircuit?(s.circuit||[]).reduce(function(n,r){return n+r.filter(Boolean).length;},0):0;
    var qubitCount = isCircuit?(s.circuit||[]).filter(function(r){return r.some(Boolean);}).length:0;
    var depth = isCircuit?(s.circuit||[]).reduce(function(mx,r){var last=r.reduce(function(m,c,i){return c?i:m;},-1);return Math.max(mx,last+1);},-1):0;
    var hasEntangle = isCircuit&&(s.circuit||[]).some(function(r){return r.indexOf("CX")>=0;});
    var charCount = !isCircuit?s.content.length:0;
    var pageCount = !isCircuit?Math.max(1,Math.ceil(s.content.length/800)):0;
    var readMin = !isCircuit?Math.max(1,Math.ceil(s.content.split(" ").length/200)):0;
    var typeTag = isCircuit
      ? {label:"회로", clr:t.ACC}
      : s.av==="🔗" ? {label:"링크", clr:t.T3}
      : s.av==="📁"||s.icon==="📕" ? {label:"파일", clr:t.AMB}
      : {label:"문서", clr:t.T3};
    return (
      <div key={s.id} style={{background:isChecked?t.ACC+"08":(t.isDark?t.CARD:"transparent"),border:"1px solid "+(isChecked?t.ACC+"44":t.BDR),borderRadius:10,padding:"10px 12px",transition:"border-color .18s",display:"flex",flexDirection:"column",gap:6,marginBottom:7,cursor:"pointer"}} onClick={function(){setSrcPage(s);}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div onClick={function(e){e.stopPropagation();toggleSource(s);}} style={{width:17,height:17,borderRadius:4,border:"1.5px solid "+(isChecked?t.ACC:t.T3),background:isChecked?t.ACC:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer",transition:"all .18s"}}>
            {isChecked && <span style={{color:"#fff",fontSize:10,fontWeight:900,lineHeight:1}}>✓</span>}
          </div>
          <span style={{flex:1,color:isChecked?t.ACC:t.T1,fontSize:12,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.title}</span>
          <span style={{background:typeTag.clr+"12",border:"1px solid "+typeTag.clr+"33",color:typeTag.clr,padding:"1px 6px",borderRadius:5,fontSize:9,fontWeight:600,flexShrink:0}}>{typeTag.label}</span>
          <span style={{color:t.T3,fontSize:11,flexShrink:0}}>›</span>
        </div>
        {!isCircuit ? (
          <p style={{color:t.T2,fontSize:11,lineHeight:1.6,margin:0,paddingLeft:25,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{s.content}</p>
        ) : (
          <div style={{paddingLeft:25,display:"flex",flexDirection:"column",gap:2}}>
            {(s.circuit||[]).filter(function(row){return row.some(Boolean);}).slice(0,2).map(function(row,q) {
              return (
                <div key={q} style={{display:"flex",alignItems:"center",gap:1}}>
                  <span style={{color:t.ACC,fontSize:8,width:20,textAlign:"right",paddingRight:3}}>q[{q}]</span>
                  {row.slice(0,6).map(function(cell,s2) {
                    var g = cell?GATE_DEFS(t).find(function(x){return x.id===cell;}):null;
                    return <div key={s2} style={{width:14,height:11,borderRadius:2,background:g?g.clr+"20":"transparent",border:"1px solid "+(g?g.clr:t.T3+"22"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:6.5,fontWeight:g?800:400,color:g?g.clr:t.T3}}>{g?g.lbl:"─"}</div>;
                  })}
                  {row.length>6&&<span style={{color:t.T3,fontSize:8}}>…</span>}
                </div>
              );
            })}
          </div>
        )}
        <div style={{display:"flex",alignItems:"center",gap:6,paddingLeft:25}}>
          {!isCircuit && <span style={{color:t.T3,fontSize:9.5}}>{pageCount}p</span>}
          {!isCircuit && <span style={{color:t.T3,fontSize:9.5,opacity:.4}}>·</span>}
          {!isCircuit && <span style={{color:t.T3,fontSize:9.5}}>{charCount.toLocaleString()}자</span>}
          {!isCircuit && <span style={{color:t.T3,fontSize:9.5,opacity:.4}}>·</span>}
          {!isCircuit && <span style={{color:t.T3,fontSize:9.5}}>약 {readMin}분</span>}
          {isCircuit && <span style={{color:t.T3,fontSize:9.5}}>{qubitCount}큐비트</span>}
          {isCircuit && <span style={{color:t.T3,fontSize:9.5,opacity:.4}}>·</span>}
          {isCircuit && <span style={{color:t.T3,fontSize:9.5}}>{gateCount}게이트</span>}
          {isCircuit && <span style={{color:t.T3,fontSize:9.5,opacity:.4}}>·</span>}
          {isCircuit && <span style={{color:t.T3,fontSize:9.5}}>깊이 {depth}</span>}
          <span style={{flex:1}}/>
          {(s.addedAt||s.savedAt) && <span style={{color:t.T3,fontSize:9.5,flexShrink:0}}>{s.addedAt||s.savedAt}</span>}
        </div>
        {(s.tags||[]).length>0 && (
          <div style={{display:"flex",flexWrap:"wrap",gap:4,paddingLeft:25,borderTop:"1px solid "+t.BDR,paddingTop:6,marginTop:2}}>
            {(s.tags||[]).map(function(tag,i){
              return <span key={i} style={{background:t.ACC+"12",border:"1px solid "+t.ACC+"33",color:t.ACC,padding:"1px 7px",borderRadius:8,fontSize:9.5,fontWeight:500}}># {tag}</span>;
            })}
          </div>
        )}
      </div>
    );
  }

  var TABS = [{id:"sources",label:"자료"},{id:"tutorials",label:"커리큘럼"},{id:"collab",label:"팀 스터디"}];

  return (
    <div style={{width:(props.panelWidth||280),flexShrink:0,borderRight:"1px solid "+t.BDR,background:t.SURF,display:"flex",flexDirection:"column",transition:"background .25s",overflow:"hidden"}}>
      {/* Top tabs */}
      <div style={{display:"flex",borderBottom:"1px solid "+t.BDR,padding:"0 10px",flexShrink:0,height:40,alignItems:"stretch"}}>
        {TABS.map(function(tb) {
          return (
            <button key={tb.id} onClick={function(){setTab(tb.id);}} style={{flex:1,padding:"0 4px",background:"transparent",border:"none",borderBottom:"2px solid "+(tab===tb.id?t.ACC:"transparent"),color:tab===tb.id?t.ACC:t.T2,fontWeight:tab===tb.id?600:400,fontSize:12,cursor:"pointer",transition:"all .18s"}}>
              {tb.label}
            </button>
          );
        })}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:8}}>

        {/* ── SOURCES TAB ── */}
        {tab==="sources" && (
          <div style={{display:"flex",flexDirection:"column",flex:1,minHeight:0}}>
            {/* Detail page */}
            {srcPage ? (
              <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,flexShrink:0}}>
                  <button onClick={function(){setSrcPage(null);}} style={{background:"transparent",border:"none",color:t.ACC,fontSize:13,cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:4,fontWeight:600}}>← 뒤로</button>
                  <span style={{flex:1}}/>
                  <button onClick={function(){setSources(function(p){return p.filter(function(s){return s.id!==srcPage.id;});});setSrcPage(null);}} style={{background:"transparent",border:"1px solid "+t.RED+"55",color:t.RED,padding:"3px 9px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer"}}>삭제</button>
                </div>
                <div style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:10,flexShrink:0}}>
                  <span style={{fontSize:18}}>{srcPage.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{color:t.T1,fontWeight:700,fontSize:12.5,lineHeight:1.3,marginBottom:6}}>{srcPage.title}</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4,alignItems:"center"}}>
                      {(function(){
                        var isCircuit = srcPage.type==="ref-circuit"||srcPage.circuit;
                        var tag = isCircuit ? {label:"회로",clr:t.ACC} : srcPage.av==="🔗" ? {label:"링크",clr:t.T3} : srcPage.av==="📁"||srcPage.icon==="📕" ? {label:"파일",clr:t.AMB} : {label:"문서",clr:t.T3};
                        return <span style={{background:tag.clr+"12",border:"1px solid "+tag.clr+"33",color:tag.clr,padding:"1px 6px",borderRadius:5,fontSize:9,fontWeight:600}}>{tag.label}</span>;
                      })()}
                      {(srcPage.tags||[]).map(function(tag,i){return <span key={i} style={{background:t.ACC+"12",border:"1px solid "+t.ACC+"33",color:t.ACC,padding:"1px 6px",borderRadius:5,fontSize:9,fontWeight:600}}>#{tag}</span>;})}
                    </div>
                  </div>
                </div>
                {srcPage.circuit && (
                  <div style={{background:t.isDark?t.BG:t.CARDH,border:"1px solid "+t.BDR,borderRadius:8,padding:"9px 10px",marginBottom:8,flexShrink:0}}>
                    <div style={{color:t.T3,fontSize:9.5,letterSpacing:".07em",textTransform:"uppercase",marginBottom:6}}>회로 ({srcPage.circuit.reduce(function(n,r){return n+r.filter(Boolean).length;},0)}게이트)</div>
                    {srcPage.circuit.map(function(row,q) {
                      return (
                        <div key={q} style={{display:"flex",alignItems:"center",gap:1,marginBottom:2}}>
                          <span style={{color:t.ACC,fontSize:9,width:24,textAlign:"right",paddingRight:4,flexShrink:0}}>q[{q}]</span>
                          {row.map(function(cell,s) {
                            var g = cell ? GATE_DEFS(t).find(function(x){return x.id===cell;}) : null;
                            return <div key={s} style={{width:16,height:14,borderRadius:3,background:g?g.clr+"20":"transparent",border:"1px solid "+(g?g.clr:t.T3+"22"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:7.5,fontWeight:g?800:400,color:g?g.clr:t.T3}}>{g?g.lbl:"─"}</div>;
                          })}
                        </div>
                      );
                    })}
                    <button onClick={function(){if(props.setCircuit){props.setCircuit(srcPage.circuit);props.onSimTrigger&&props.onSimTrigger();} setSrcPage(null);}} style={{marginTop:8,width:"100%",padding:"5px",background:"transparent",border:"1px solid "+t.BDR,borderRadius:6,color:t.T2,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                      📥 에디터에 불러오기
                    </button>
                  </div>
                )}
                <div style={{flex:1,overflowY:"auto",background:t.isDark?t.BG:t.CARDH,border:"1px solid "+t.BDR,borderRadius:8,padding:10,marginBottom:10}}>
                  <p style={{color:t.T2,fontSize:11.5,lineHeight:1.8,margin:0}}>{srcPage.content}</p>
                </div>
                <button onClick={function(){toggleSource(srcPage);}} style={{width:"100%",padding:"8px",borderRadius:9,background:srcPageChecked?t.ACC+"18":"linear-gradient(135deg,"+t.ACC+","+t.PUR+")",border:srcPageChecked?"1px solid "+t.ACC+"55":"none",color:srcPageChecked?t.ACC:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  <span style={{width:16,height:16,borderRadius:4,background:srcPageChecked?"transparent":"rgba(255,255,255,.25)",border:srcPageChecked?"2px solid "+t.ACC:"2px solid rgba(255,255,255,.6)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:srcPageChecked?t.ACC:"#fff"}}>{srcPageChecked?"✓":""}</span>
                  {srcPageChecked?"컨텍스트 적용 중 — 해제":"컨텍스트에 추가"}
                </button>
              </div>
            ) : (
              /* List page */
              <div style={{display:"flex",flexDirection:"column",flex:1,minHeight:0}}>
                {/* Sub-tabs */}
                <div style={{display:"flex",background:t.isDark?t.BG:t.CARDH,borderRadius:9,padding:2,gap:2,marginBottom:10,flexShrink:0}}>
                  <button onClick={function(){setSrcSubTab("doc");}} style={{flex:1,padding:"5px 0",borderRadius:7,border:"none",fontSize:12,fontWeight:srcSubTab==="doc"?700:400,cursor:"pointer",background:srcSubTab==="doc"?t.SURF:"transparent",color:srcSubTab==="doc"?t.ACC:t.T2,transition:"all .18s"}}>📄 문서</button>
                  <button onClick={function(){setSrcSubTab("circuit");}} style={{flex:1,padding:"5px 0",borderRadius:7,border:"none",fontSize:12,fontWeight:srcSubTab==="circuit"?700:400,cursor:"pointer",background:srcSubTab==="circuit"?t.SURF:"transparent",color:srcSubTab==="circuit"?t.ACC:t.T2,transition:"all .18s"}}>⚛ 회로</button>
                </div>

                {/* 문서 sub-tab */}
                {srcSubTab==="doc" && (
                  <div style={{display:"flex",flexDirection:"column"}}>
                    <input ref={fileInputRef} type="file" accept=".txt,.md,.csv,.text,.pdf" onChange={handleFileChange} style={{display:"none"}}/>
                    <div style={{background:t.isDark?t.CARD:t.CARDH,margin:"0 -14px",padding:"12px 14px 14px",borderBottom:"1px solid "+t.BDR,marginBottom:10}}>
                    {!srcAddMode ? (
                      <div>
                        <div style={{color:t.T3,fontSize:9.5,letterSpacing:".07em",textTransform:"uppercase",marginBottom:8}}>자료 추가</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:10}}>
                          {[{mode:"url",icon:"🔗",label:"링크"},{mode:"file",icon:"📁",label:"파일"},{mode:"text",icon:"📝",label:"텍스트"}].map(function(opt) {
                            return (
                              <button key={opt.mode} onClick={function(){
                                if (opt.mode==="file"){if(fileInputRef.current)fileInputRef.current.click();}
                                else setSrcAddMode(opt.mode);
                              }} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,padding:"7px 4px",borderRadius:8,border:"1px solid "+t.BDR,background:t.isDark?t.CARD:t.CARDH,color:t.T2,fontSize:10,fontWeight:600,cursor:"pointer",transition:"all .15s",textAlign:"center",minHeight:44}}>
                                <span style={{fontSize:15}}>{opt.icon}</span>
                                <span style={{lineHeight:1.2}}>{opt.label}</span>
                              </button>
                            );
                          })}
                        </div>
                        <button onClick={function(){if(onStartSourceSearch)onStartSourceSearch("doc");}} style={{width:"100%",padding:"8px",borderRadius:9,background:"linear-gradient(135deg,"+t.ACC+"22,"+t.PUR+"22)",border:"1px dashed "+t.ACC+"55",color:t.ACC,fontSize:11.5,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                          <span>✦</span> AI로 자료 찾기
                        </button>
                      </div>
                    ) : (
                      <div style={{background:t.isDark?t.CARD:t.CARDH,border:"1px solid "+t.BDRH,borderRadius:10,padding:12,marginBottom:10}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                          <span style={{color:t.T1,fontWeight:600,fontSize:12}}>{srcAddMode==="url"?"🔗 링크 추가":srcAddMode==="file"?"📁 파일 추가":"📝 텍스트 추가"}</span>
                          <button onClick={function(){setSrcAddMode(null);setNewUrl("");setNewTitle("");setNewText("");}} style={{marginLeft:"auto",background:"transparent",border:"none",color:t.T3,fontSize:14,cursor:"pointer",lineHeight:1}}>✕</button>
                        </div>
                        {srcAddMode==="url" && (
                          <div style={{display:"flex",flexDirection:"column",gap:7}}>
                            <input value={newUrl} onChange={function(e){setNewUrl(e.target.value);}} placeholder="https://arxiv.org/abs/..." style={{background:t.SURF,border:"1px solid "+t.BDR,borderRadius:7,color:t.T1,padding:"8px 10px",fontSize:12,outline:"none",width:"100%",boxSizing:"border-box"}}/>
                            <input value={newTitle} onChange={function(e){setNewTitle(e.target.value);}} placeholder="제목 (선택)" style={{background:t.SURF,border:"1px solid "+t.BDR,borderRadius:7,color:t.T1,padding:"7px 10px",fontSize:11.5,outline:"none",width:"100%",boxSizing:"border-box"}}/>
                            <input value={newTags} onChange={function(e){setNewTags(e.target.value);}} placeholder="태그 (쉼표로 구분)" style={{background:t.SURF,border:"1px solid "+t.BDR,borderRadius:7,color:t.T1,padding:"7px 10px",fontSize:11.5,outline:"none",width:"100%",boxSizing:"border-box"}}/>
                            <button onClick={addFromUrl} disabled={!newUrl.trim()} style={{background:newUrl.trim()?"linear-gradient(135deg,"+t.ACC+","+t.PUR+")":t.BDR,color:newUrl.trim()?"#fff":t.T3,border:"none",padding:"8px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"}}>추가하기</button>
                          </div>
                        )}
                        {srcAddMode==="text" && (
                          <div style={{display:"flex",flexDirection:"column",gap:7}}>
                            <input value={newTitle} onChange={function(e){setNewTitle(e.target.value);}} placeholder="자료 제목" style={{background:t.SURF,border:"1px solid "+t.BDR,borderRadius:7,color:t.T1,padding:"8px 10px",fontSize:12,outline:"none",width:"100%",boxSizing:"border-box"}}/>
                            <textarea value={newText} onChange={function(e){setNewText(e.target.value);}} placeholder="논문, 노트, 강의 내용 등을 붙여넣기..." rows={5} style={{background:t.SURF,border:"1px solid "+t.BDR,borderRadius:7,color:t.T1,padding:"8px 10px",fontSize:11.5,outline:"none",width:"100%",boxSizing:"border-box",resize:"vertical",fontFamily:"inherit"}}/>
                            <input value={newTags} onChange={function(e){setNewTags(e.target.value);}} placeholder="태그 (쉼표로 구분)" style={{background:t.SURF,border:"1px solid "+t.BDR,borderRadius:7,color:t.T1,padding:"7px 10px",fontSize:11.5,outline:"none",width:"100%",boxSizing:"border-box"}}/>
                            <button onClick={addFromText} disabled={!newTitle.trim()||!newText.trim()} style={{background:(newTitle.trim()&&newText.trim())?"linear-gradient(135deg,"+t.ACC+","+t.PUR+")":t.BDR,color:(newTitle.trim()&&newText.trim())?"#fff":t.T3,border:"none",padding:"8px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"}}>추가하기</button>
                          </div>
                        )}
                      </div>
                    )}
                    </div>
                    {/* 검색 + 정렬 */}
                    <div style={{display:"flex",gap:5,marginBottom:8,flexShrink:0}}>
                      <input value={srcSearch} onChange={function(e){setSrcSearch(e.target.value);}} placeholder="검색..." style={{flex:1,background:t.isDark?t.CARD:t.CARDH,border:"1px solid "+t.BDR,borderRadius:7,color:t.T1,padding:"5px 9px",fontSize:11.5,outline:"none"}}/>
                      <select value={srcSort} onChange={function(e){setSrcSort(e.target.value);}} style={{background:t.isDark?t.CARD:t.CARDH,border:"1px solid "+t.BDR,borderRadius:7,color:t.T2,fontSize:11,padding:"5px 6px",outline:"none",cursor:"pointer"}}>
                        <option value="newest">최신순</option>
                        <option value="oldest">오래된순</option>
                        <option value="alpha">가나다순</option>
                      </select>
                    </div>
                    {docs.map(renderSrc)}
                    {docs.length===0 && !srcAddMode && (
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",paddingTop:24,gap:10}}>
                        <div style={{fontSize:32,opacity:.3}}>📄</div>
                        <div style={{color:t.T3,fontSize:11.5,textAlign:"center",lineHeight:1.8}}>링크, 파일, 텍스트로<br/>자료를 추가해보세요</div>
                      </div>
                    )}
                  </div>
                )}

                {/* 회로 sub-tab — 레퍼런스 전용 */}
                {srcSubTab==="circuit" && (
                  <div style={{display:"flex",flexDirection:"column"}}>
                    <input ref={circFileInputRef} type="file" accept=".py,.qasm,.qpy,.txt" onChange={handleCircuitFileChange} style={{display:"none"}}/>
                    <div style={{background:t.isDark?t.CARD:t.CARDH,margin:"0 -14px",padding:"12px 14px 14px",borderBottom:"1px solid "+t.BDR,marginBottom:10}}>
                    {!srcAddMode || (srcAddMode!=="circ-url"&&srcAddMode!=="circ-text") ? (
                      <div>
                        <div style={{color:t.T3,fontSize:9.5,letterSpacing:".07em",textTransform:"uppercase",marginBottom:8}}>자료 추가</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:10}}>
                          {[{mode:"circ-url",icon:"🔗",label:"링크"},{mode:"circ-file",icon:"📁",label:"파일"},{mode:"circ-text",icon:"📝",label:"코드"}].map(function(opt) {
                            return (
                              <button key={opt.mode} onClick={function(){
                                if (opt.mode==="circ-file"){if(circFileInputRef.current)circFileInputRef.current.click();}
                                else setSrcAddMode(opt.mode);
                              }} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,padding:"7px 4px",borderRadius:8,border:"1px solid "+t.BDR,background:t.isDark?t.CARD:t.CARDH,color:t.T2,fontSize:10,fontWeight:600,cursor:"pointer",transition:"all .15s",textAlign:"center",minHeight:44}}>
                                <span style={{fontSize:15}}>{opt.icon}</span>
                                <span style={{lineHeight:1.2}}>{opt.label}</span>
                              </button>
                            );
                          })}
                        </div>
                        <button onClick={function(){if(onStartSourceSearch)onStartSourceSearch("circuit");}} style={{width:"100%",padding:"8px",borderRadius:9,background:"linear-gradient(135deg,"+t.ACC+"22,"+t.PUR+"22)",border:"1px dashed "+t.ACC+"55",color:t.ACC,fontSize:11.5,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                          <span>✦</span> AI로 자료 찾기
                        </button>
                      </div>
                    ) : (
                      <div style={{background:t.isDark?t.CARD:t.CARDH,border:"1px solid "+t.BDRH,borderRadius:10,padding:12,marginBottom:10}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                          <span style={{color:t.T1,fontWeight:600,fontSize:12}}>{srcAddMode==="circ-url"?"🔗 링크 추가":"📝 코드 추가"}</span>
                          <button onClick={function(){setSrcAddMode(null);setNewUrl("");setNewTitle("");setNewText("");}} style={{marginLeft:"auto",background:"transparent",border:"none",color:t.T3,fontSize:14,cursor:"pointer"}}>✕</button>
                        </div>
                        {srcAddMode==="circ-url" && (
                          <div style={{display:"flex",flexDirection:"column",gap:7}}>
                            <input value={newUrl} onChange={function(e){setNewUrl(e.target.value);}} placeholder="https://..." style={{background:t.SURF,border:"1px solid "+t.BDR,borderRadius:7,color:t.T1,padding:"8px 10px",fontSize:12,outline:"none",width:"100%",boxSizing:"border-box"}}/>
                            <input value={newTitle} onChange={function(e){setNewTitle(e.target.value);}} placeholder="제목 (선택)" style={{background:t.SURF,border:"1px solid "+t.BDR,borderRadius:7,color:t.T1,padding:"7px 10px",fontSize:11.5,outline:"none",width:"100%",boxSizing:"border-box"}}/>
                            <input value={newTags} onChange={function(e){setNewTags(e.target.value);}} placeholder="태그 (쉼표로 구분)" style={{background:t.SURF,border:"1px solid "+t.BDR,borderRadius:7,color:t.T1,padding:"7px 10px",fontSize:11.5,outline:"none",width:"100%",boxSizing:"border-box"}}/>
                            <button onClick={addCircuitFromUrl} disabled={!newUrl.trim()} style={{background:newUrl.trim()?"linear-gradient(135deg,"+t.ACC+","+t.PUR+")":t.BDR,color:newUrl.trim()?"#fff":t.T3,border:"none",padding:"8px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"}}>추가하기</button>
                          </div>
                        )}
                        {srcAddMode==="circ-text" && (
                          <div style={{display:"flex",flexDirection:"column",gap:7}}>
                            <input value={newTitle} onChange={function(e){setNewTitle(e.target.value);}} placeholder="회로 이름" style={{background:t.SURF,border:"1px solid "+t.BDR,borderRadius:7,color:t.T1,padding:"8px 10px",fontSize:12,outline:"none",width:"100%",boxSizing:"border-box"}}/>
                            <textarea value={newText} onChange={function(e){setNewText(e.target.value);}} placeholder={"from qiskit import QuantumCircuit\nqc = QuantumCircuit(3)\nqc.h(0)\nqc.cx(0, 1)"} rows={5} style={{background:t.SURF,border:"1px solid "+t.BDR,borderRadius:7,color:t.T1,padding:"8px 10px",fontSize:11,outline:"none",width:"100%",boxSizing:"border-box",resize:"vertical",fontFamily:"monospace"}}/>
                            <input value={newTags} onChange={function(e){setNewTags(e.target.value);}} placeholder="태그 (쉼표로 구분)" style={{background:t.SURF,border:"1px solid "+t.BDR,borderRadius:7,color:t.T1,padding:"7px 10px",fontSize:11.5,outline:"none",width:"100%",boxSizing:"border-box"}}/>
                            <button onClick={addCircuitFromText} disabled={!newTitle.trim()||!newText.trim()} style={{background:(newTitle.trim()&&newText.trim())?"linear-gradient(135deg,"+t.ACC+","+t.PUR+")":t.BDR,color:(newTitle.trim()&&newText.trim())?"#fff":t.T3,border:"none",padding:"8px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"}}>추가하기</button>
                          </div>
                        )}
                      </div>
                    )}
                    </div>
                    {/* 검색 + 정렬 */}
                    <div style={{display:"flex",gap:5,marginBottom:8,flexShrink:0}}>
                      <input value={srcSearch} onChange={function(e){setSrcSearch(e.target.value);}} placeholder="검색..." style={{flex:1,background:t.isDark?t.CARD:t.CARDH,border:"1px solid "+t.BDR,borderRadius:7,color:t.T1,padding:"5px 9px",fontSize:11.5,outline:"none"}}/>
                      <select value={srcSort} onChange={function(e){setSrcSort(e.target.value);}} style={{background:t.isDark?t.CARD:t.CARDH,border:"1px solid "+t.BDR,borderRadius:7,color:t.T2,fontSize:11,padding:"5px 6px",outline:"none",cursor:"pointer"}}>
                        <option value="newest">최신순</option>
                        <option value="oldest">오래된순</option>
                        <option value="alpha">가나다순</option>
                      </select>
                    </div>
                    {/* 레퍼런스 회로 목록 */}
                    {refC.length>0 ? (
                      <div>
                        {refC.map(renderSrc)}
                      </div>
                    ) : (
                      !srcAddMode && (
                        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",paddingTop:24,gap:10}}>
                          <div style={{fontSize:32,opacity:.3}}>⚛</div>
                          <div style={{color:t.T3,fontSize:11.5,textAlign:"center",lineHeight:1.8}}>링크, 파일, 코드로<br/>회로를 추가해보세요</div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TUTORIALS TAB ── */}
        {tab==="tutorials" && (
          <TutorialsTab activeTutorial={activeTutorial} activeLessonIdx={activeLessonIdx} onStartLesson={onStartLesson} quizResults={quizResults} onStartQuiz={onStartQuiz} circuit={circuit} setCircuit={setCircuit} practiceResults={practiceResults} onPracticeResult={onPracticeResult}/>
        )}

        {/* ── COLLAB TAB ── */}
        {tab==="collab" && (
          <CollabTab onSendToChat={onSendToChat} sharedNotes={sharedNotes}/>
        )}

      </div>
      {tab==="sources" && !srcPage && (function(){
        var list = srcSubTab==="doc" ? docs : refC;
        if (list.length===0) return null;
        var checkedCount = list.filter(function(s){return activeSources.some(function(a){return a.id===s.id;});}).length;
        var allChecked = checkedCount===list.length;
        var label = allChecked ? "전체 참조 해제" : "전체 참조";
        return (
          <div style={{flexShrink:0,borderTop:"1px solid "+t.BDR,padding:"8px 14px",background:t.SURF}}>
            <button onClick={function(){
              if (allChecked) { list.forEach(function(s){if(activeSources.some(function(a){return a.id===s.id;}))toggleSource(s);}); }
              else { list.forEach(function(s){if(!activeSources.some(function(a){return a.id===s.id;}))toggleSource(s);}); }
            }} style={{width:"100%",padding:"6px 10px",borderRadius:7,border:"1px solid "+t.BDR,background:"transparent",color:t.T2,fontSize:11,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              <span>{label}</span>
              {checkedCount>0 && <span style={{background:t.ACC,color:"#fff",borderRadius:10,padding:"0px 6px",fontSize:10,fontWeight:700}}>{checkedCount}</span>}
            </button>
          </div>
        );
      })()}
    </div>
  );
}

var INIT_MSGS = [{role:"assistant",id:"init",time:"",content:"안녕하세요! **QX Assistant**입니다.\n왼쪽에서 자료나 커리큘럼을 선택하면 그에 맞춘 도움을 드립니다. 완성된 회로는 오른쪽 에디터에서 확인하고 **제출**할 수 있어요."}];

function ChatCenter(props) {
  var t = useT();
  var circuit = props.circuit;
  var setCircuit = props.setCircuit;
  var activeSources = props.activeSources || [];
  var activeTutorial = props.activeTutorial;
  var activeLessonIdx = props.activeLessonIdx;
  var onNextLesson = props.onNextLesson;
  var onPrevLesson = props.onPrevLesson;
  var onQuiz = props.onQuiz;
  var chatPrompt = props.chatPrompt;
  var onSaveMsg = props.onSaveMsg;
  var onUnsaveMsg = props.onUnsaveMsg;
  var savedIds = props.savedIds || [];
  var onQuizScore = props.onQuizScore;
  var chatMode = props.chatMode || "normal";
  var onExitSearchMode = props.onExitSearchMode;
  var onAddSource = props.onAddSource;
  var [addedSourceIds, setAddedSourceIds] = useState([]);

  var msgs = props.msgs || INIT_MSGS;
  var setMsgs = props.setMsgs || function(){};
  var [inp, setInp] = useState("");
  var [busy, setBusy] = useState(false);
  var endRef = useRef(null);

  var onSetCircuitSource = props.onSetCircuitSource;
  var msgElRefs = useRef({});

  useEffect(function() { if (endRef.current) endRef.current.scrollIntoView({behavior:"smooth"}); }, [msgs]);

  var onAddCircuit = props.onAddCircuit;
  var [savedCircuitMsgIds, setSavedCircuitMsgIds] = useState([]);
  function loadCircuit(data, msgId) {
    setCircuit(data.rows);
    if (onSetCircuitSource) onSetCircuitSource({type:"ai", msgId:msgId, note:data.note});
  }

  function parseSourceRecs(text) {
    var m = text.match(/\[SOURCES\]([\s\S]*?)\[\/SOURCES\]/);
    if (!m) return null;
    try { return JSON.parse(m[1].trim()); } catch(e) { return null; }
  }
  function stripSourceRecs(text) { return text.replace(/\[SOURCES\][\s\S]*?\[\/SOURCES\]/g,"").trim(); }

  async function send(txt, quizCtx) {
    var text = txt !== undefined ? txt : inp;
    if (!text.trim() || busy) return;
    var isSearchTrigger = text.startsWith("__SOURCE_SEARCH__:");
    var searchType = isSearchTrigger ? text.split(":")[1] : null;
    var msgId = "m"+Date.now();
    var now = new Date(); var hhmm = now.getHours().toString().padStart(2,"0")+":"+now.getMinutes().toString().padStart(2,"0");
    if (isSearchTrigger) {
      var initMsg = searchType==="circuit"
        ? "안녕하세요! **자료 탐색 모드**입니다 🔍\n\n어떤 **회로 레퍼런스**를 찾고 계신가요?\n\n몇 가지 여쭤볼게요:\n1. 어떤 알고리즘이나 주제에 관심 있으신가요? (예: Bell 상태, Grover, VQE...)\n2. 현재 학습 수준은 어느 정도인가요? (입문 / 초급 / 중급 / 고급)"
        : "안녕하세요! **자료 탐색 모드**입니다 🔍\n\n어떤 **문서나 자료**를 찾고 계신가요?\n\n몇 가지 여쭤볼게요:\n1. 어떤 주제를 공부하고 있나요? (예: 양자역학 기초, Grover 알고리즘, 오류 보정...)\n2. 논문, 강의 노트, 커리큘럼 중 어떤 형태가 좋으신가요?";
      setMsgs(function(p){ return p.concat([{role:"assistant",content:initMsg,id:"search_init_"+Date.now(),time:hhmm}]); });
      setInp("");
      return;
    }
    var uMsg = {role:"user", content:text, id:msgId+"u", time:hhmm};
    setMsgs(function(p) { return p.concat([uMsg]); });
    setInp(""); setBusy(true);
    var sys = makeSysPrompt({sources:activeSources, tutorial:activeTutorial, searchMode:chatMode==="search", searchType:searchType});
    try {
      var history = msgs.concat([uMsg]).map(function(m){return {role:m.role,content:m.content};});
      var rep = await callClaude(history, sys);
      if (quizCtx && onQuizScore) {
        var qm = rep.match(/총점[^0-9]*(\d+)\s*\/\s*(\d+)/);
        if (qm) onQuizScore(quizCtx.tutId, quizCtx.lessonIdx, parseInt(qm[1]), parseInt(qm[2]));
      }
      var cData = parseCircuit(rep);
      var sRecs = parseSourceRecs(rep);
      setMsgs(function(p) { return p.concat([{role:"assistant",content:stripCircuit(stripSourceRecs(rep)),circuit:cData||undefined,sourceRecs:sRecs||undefined,id:msgId+"a",time:hhmm}]); });
    } catch (e) {
      setMsgs(function(p) { return p.concat([{role:"assistant",content:"오류가 발생했습니다. 잠시 후 다시 시도해주세요.",id:msgId+"e",time:hhmm}]); });
    }
    setBusy(false);
  }

  useEffect(function() {
    if (chatPrompt && chatPrompt.text) send(chatPrompt.text, chatPrompt.quizCtx || null);
  }, [chatPrompt]);

  var curLesson = (activeTutorial && activeLessonIdx !== null) ? (TUTORIAL_LESSONS[activeTutorial.id]||[])[activeLessonIdx] : null;

  var docSrcs = activeSources.filter(function(s){return s.type==="doc";});
  var circSrcs = activeSources.filter(function(s){return s.type==="ref-circuit";});
  var hasDoc = docSrcs.length > 0;
  var hasCirc = circSrcs.length > 0;

  var BTNS = [];
  if (hasDoc && hasCirc) {
    BTNS = [
      { label:"이론-회로 연결",    clr:"#0091CC", prompt:"선택한 문서의 이론이 선택한 회로에 어떻게 구현되었는지 연결해서 설명해줘" },
      { label:"구현 검증",        clr:"#0091CC", prompt:"문서의 알고리즘이 선택한 회로에 올바르게 구현됐는지 검증해줘" },
      { label:"개념 보완",        clr:"#0091CC", prompt:"이 회로를 이해하기 위해 선택한 자료에서 필요한 핵심 개념을 추출해줘" },
      { label:"통합 학습 가이드", clr:"#0091CC", prompt:"선택한 자료들을 종합해서 학습 순서와 방법을 가이드해줘" },
    ];
  } else if (hasDoc && docSrcs.length===1) {
    var srcT1 = '"' + docSrcs[0].title + '"';
    BTNS = [
      { label:"자료 요약",  clr:"#0091CC", prompt: srcT1 + " 내용을 3~5줄로 요약해줘" },
      { label:"핵심 개념",  clr:"#0091CC", prompt: srcT1 + " 핵심 개념 5가지를 뽑아줘" },
      { label:"학습 질문",  clr:"#0091CC", prompt: srcT1 + " 내용으로 학습 질문 3개를 만들어줘" },
      { label:"회로 생성",  clr:"#0091CC", prompt: srcT1 + " 내용을 바탕으로 양자 회로를 생성해줘" },
    ];
  } else if (hasDoc) {
    var docN = docSrcs.length + "개 문서";
    BTNS = [
      { label:"자료 비교",   clr:"#0091CC", prompt: docN + "의 공통점과 차이점을 비교해줘" },
      { label:"통합 요약",   clr:"#0091CC", prompt: docN + "를 통합해서 핵심 내용을 요약해줘" },
      { label:"학습 로드맵", clr:"#0091CC", prompt: docN + "를 기반으로 학습 순서와 로드맵을 제안해줘" },
      { label:"회로 생성",   clr:"#0091CC", prompt: docN + "를 바탕으로 양자 회로를 생성해줘" },
    ];
  } else if (hasCirc && circSrcs.length===1) {
    var circT1 = '"' + circSrcs[0].title + '"';
    BTNS = [
      { label:"회로 설명",    clr:"#6B40D6", prompt: circT1 + " 회로를 단계별로 설명해줘" },
      { label:"개선 제안",    clr:"#6B40D6", prompt: circT1 + " 회로를 개선할 수 있는 방법을 제안해줘" },
      { label:"Qiskit 변환",  clr:"#6B40D6", prompt: circT1 + " 회로를 Qiskit 코드로 변환해줘" },
      { label:"유사 알고리즘", clr:"#6B40D6", prompt: circT1 + " 회로와 유사한 양자 알고리즘이 있나요?" },
    ];
  } else if (hasCirc) {
    var circN = circSrcs.length + "개 회로";
    BTNS = [
      { label:"회로 비교",  clr:"#6B40D6", prompt: circN + "의 구조와 차이점을 비교해줘" },
      { label:"공통 패턴",  clr:"#6B40D6", prompt: circN + "에서 공통으로 나타나는 게이트 패턴을 분석해줘" },
      { label:"최적 회로",  clr:"#6B40D6", prompt: circN + " 중 가장 효율적인 회로를 추천하고 이유를 설명해줘" },
      { label:"통합 설명",  clr:"#6B40D6", prompt: circN + "를 종합적으로 설명해줘" },
    ];
  } else if (curLesson) {
    var lesT = '"' + curLesson.title + '"';
    BTNS = [
      { label:"더 자세히",   clr:"#6B40D6", prompt: lesT + " 개념을 더 자세히 설명해줘" },
      { label:"수식 보기",   clr:"#6B40D6", prompt: "이 단계의 양자 상태를 Dirac 표기법으로 보여줘" },
      { label:"Qiskit 코드", clr:"#6B40D6", prompt: "현재 레슨을 Qiskit 코드로 구현해줘" },
      { label:"다른 방법",   clr:"#6B40D6", prompt: "이 개념을 다른 방식이나 게이트로 구현할 수 있나요?" },
    ];
  }

  var QUICK = activeSources.length>0
    ? (activeSources.length===1?['"'+activeSources[0].title+'" 내용 요약해줘',"이 자료 관련 회로 만들어줘","핵심 개념 알려줘"]
      :["선택한 자료들을 비교해줘","자료들의 공통 개념을 알려줘","회로를 만들어줘"])
    : activeTutorial
    ? [activeTutorial.title+" 커리큘럼 시작해줘", "첫 번째 단계 설명해줘", "회로를 만들어줘"]
    : ["Bell 상태 회로 만들어줘", "큐비트 중첩을 설명해줘", "GHZ 상태란?"];

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0,background:t.BG}}>
      {(activeSources.length>0||activeTutorial) && (
        <div style={{padding:"8px 16px",borderBottom:"1px solid "+t.BDR,background:t.SURF,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
            <span style={{color:t.T3,fontSize:10.5,fontWeight:500}}>컨텍스트</span>
            {/* Source chips - one per selected source */}
            {activeSources.map(function(src) {
              var isCircuit = src.type==="ref-circuit";
              return (
                <span key={src.id} style={{background:t.ACC+"12",border:"1px solid "+t.ACC+"33",color:t.ACC,padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}>
                  {isCircuit?"⚛":"📄"} {src.title.length>16?src.title.slice(0,16)+"…":src.title}
                </span>
              );
            })}
            {activeTutorial && activeSources.length===0 && (
              <span style={{background:t.PUR+"12",border:"1px solid "+t.PUR+"33",color:t.PUR,padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:600}}>
                📚 {activeTutorial.title}
              </span>
            )}
            {curLesson && (
              <span style={{background:t.isDark?t.BG:t.CARDH,border:"1px solid "+t.BDR,color:t.T2,padding:"2px 9px",borderRadius:20,fontSize:10.5}}>
                레슨 {activeLessonIdx+1} — {curLesson.title.length>20?curLesson.title.slice(0,20)+"…":curLesson.title}
              </span>
            )}
          </div>
        </div>
      )}
      {chatMode==="search" && (
        <div style={{padding:"8px 24px",background:"linear-gradient(135deg,"+t.ACC+"18,"+t.PUR+"18)",borderBottom:"1px solid "+t.ACC+"33",flexShrink:0,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14}}>✦</span>
          <span style={{color:t.ACC,fontSize:12,fontWeight:700}}>자료 탐색 모드</span>
          <span style={{color:t.T3,fontSize:11}}>— AI가 맞춤 자료를 찾아드립니다</span>
          <button onClick={onExitSearchMode} style={{marginLeft:"auto",background:"transparent",border:"1px solid "+t.BDR,color:t.T3,fontSize:11,padding:"3px 10px",borderRadius:6,cursor:"pointer"}}>탐색 종료</button>
        </div>
      )}
      <div style={{flex:1,overflowY:"auto",padding:"20px 24px 0"}}>
        <div style={{display:"flex",flexDirection:"column",gap:16,paddingBottom:16,maxWidth:760,margin:"0 auto"}}>
          {msgs.map(function(m,i) {
            return (
              <div key={i} ref={function(el){if(el&&m.id)msgElRefs.current[m.id]=el;}} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",gap:8,alignItems:"flex-start"}}>
                {m.role==="assistant" && (
                  <div style={{width:30,height:30,borderRadius:9,flexShrink:0,background:"linear-gradient(135deg,"+t.ACC+","+t.PUR+")",display:"flex",alignItems:"center",justifyContent:"center",marginTop:2,overflow:"hidden"}}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="6" width="14" height="10" rx="3" fill="white" opacity=".95"/>
                    <rect x="7" y="9" width="2" height="2" rx="1" fill="#7FC8F8"/>
                    <rect x="11" y="9" width="2" height="2" rx="1" fill="#7FC8F8"/>
                    <rect x="7.5" y="12" width="5" height="1.2" rx=".6" fill="#7FC8F8"/>
                    <rect x="8.5" y="3" width="3" height="3" rx="1" fill="white" opacity=".85"/>
                    <rect x="9.6" y="2" width=".8" height="1.5" rx=".4" fill="white" opacity=".7"/>
                    <rect x="1" y="9" width="2" height="4" rx="1" fill="white" opacity=".7"/>
                    <rect x="17" y="9" width="2" height="4" rx="1" fill="white" opacity=".7"/>
                  </svg>
                </div>
                )}
                <div style={{maxWidth:"74%"}}>
                  {m.role==="assistant" && (
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,paddingLeft:2}}>
                      <span style={{color:t.T2,fontSize:10.5,fontWeight:600}}>QX Assistant</span>
                      {m.time && <span style={{color:t.T3,fontSize:9.5}}>{m.time}</span>}
                    </div>
                  )}
                  <div style={{background:m.role==="user"?(t.isDark?t.ACC+"18":t.isDark?t.CARD:"#EEF4FF"):t.SURF,border:"1px solid "+(m.role==="user"?t.BDRH:t.BDR),borderRadius:m.role==="user"?"14px 14px 4px 14px":"4px 14px 14px 14px",padding:"11px 15px",color:t.T1,fontSize:13,lineHeight:1.8,boxShadow:t.isDark?"none":"0 1px 4px rgba(0,0,0,.06)"}} dangerouslySetInnerHTML={{__html:renderMD(m.content,t.ACC)}}/>
                  {m.circuit && <CircuitCard data={m.circuit} onLoad={function(){loadCircuit(m.circuit, m.id);}}/>}
                  {m.sourceRecs && m.sourceRecs.length>0 && (
                    <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:8}}>
                      {m.sourceRecs.map(function(rec,ri){
                        var isAdded = addedSourceIds.indexOf(m.id+"_"+ri)>=0;
                        return (
                          <div key={ri} style={{background:t.isDark?t.CARD:t.CARDH,border:"1px solid "+t.BDR,borderRadius:10,padding:"9px 12px",display:"flex",flexDirection:"column",gap:5}}>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <span style={{fontSize:13}}>{rec.type==="circuit"?"⚛":"📄"}</span>
                              <span style={{color:t.T1,fontSize:12,fontWeight:700,flex:1}}>{rec.title}</span>
                            </div>
                            {rec.desc && <p style={{color:t.T2,fontSize:11,lineHeight:1.6,margin:0}}>{rec.desc}</p>}
                            {rec.url && <span style={{color:t.T3,fontSize:10}}>{rec.url}</span>}
                            {(rec.tags||[]).length>0 && (
                              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                                {rec.tags.map(function(tag,ti){return <span key={ti} style={{background:t.ACC+"12",border:"1px solid "+t.ACC+"33",color:t.ACC,padding:"1px 7px",borderRadius:8,fontSize:9.5}}># {tag}</span>;})}
                              </div>
                            )}
                            <button onClick={function(){
                              if (isAdded) return;
                              var now=new Date().toISOString().slice(0,10);
                              var host=rec.url?rec.url.replace(/https?:\/\//,"").split("/")[0]:"AI 추천";
                              var newSrc = rec.type==="circuit"
                                ? {id:Date.now()+ri,type:"ref-circuit",icon:"🔗",title:rec.title,content:rec.desc||"",author:host,av:"🔗",addedAt:now,tags:rec.tags||[]}
                                : {id:Date.now()+ri,type:"doc",icon:"🔗",title:rec.title,content:rec.desc||"",url:rec.url,author:host,av:"🔗",addedAt:now,tags:rec.tags||[]};
                              if(onAddSource) onAddSource(newSrc);
                              setAddedSourceIds(function(p){return p.concat([m.id+"_"+ri]);});
                            }} style={{background:isAdded?t.ACC+"15":"linear-gradient(135deg,"+t.ACC+","+t.PUR+")",border:isAdded?"1px solid "+t.ACC+"44":"none",color:isAdded?t.ACC:"#fff",padding:"5px 12px",borderRadius:7,fontSize:11,fontWeight:700,cursor:isAdded?"default":"pointer",alignSelf:"flex-start",transition:"all .18s"}}>
                              {isAdded?"✓ 자료 추가됨":"+ 자료 추가"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {m.role==="user" && m.time && <div style={{color:t.T3,fontSize:9.5,marginTop:3,textAlign:"right"}}>{m.time}</div>}
                  {m.role==="assistant" && m.id && m.id!=="init" && (
                    <div style={{display:"flex",alignItems:"center",gap:5,marginTop:5,flexWrap:"wrap"}}>
                      {m.circuit && onAddCircuit && (function(){
                        var isCircSaved = savedCircuitMsgIds.indexOf(m.id)>=0;
                        return (
                          <button onClick={function(){
                            if (isCircSaved) {
                              setSavedCircuitMsgIds(function(p){return p.filter(function(x){return x!==m.id;});});
                            } else {
                              onAddCircuit(m.circuit.rows, m.circuit.note);
                              setSavedCircuitMsgIds(function(p){return p.concat([m.id]);});
                            }
                          }} style={{background:isCircSaved?t.ACC+"15":"transparent",border:"1px solid "+(isCircSaved?t.ACC+"55":t.BDR),color:isCircSaved?t.ACC:t.T3,padding:"4px 10px",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,transition:"all .18s"}}>
                            <span style={{fontSize:10}}>⚛</span>{isCircSaved?"회로 저장됨":"회로 저장"}
                          </button>
                        );
                      })()}
                      {onSaveMsg && (function(){
                        var isMemoSaved = savedIds.indexOf(m.id)>=0;
                        return (
                          <button onClick={function(){
                            if (isMemoSaved) { if(onUnsaveMsg) onUnsaveMsg(m.id); }
                            else onSaveMsg({id:m.id,content:m.content,circuit:m.circuit,time:m.time});
                          }} style={{background:isMemoSaved?t.PUR+"15":"transparent",border:"1px solid "+(isMemoSaved?t.PUR+"55":t.BDR),color:isMemoSaved?t.PUR:t.T3,padding:"4px 10px",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,transition:"all .18s"}}>
                            <span style={{fontSize:10}}>{isMemoSaved?"📌":"🔖"}</span>{isMemoSaved?"메모 저장됨":"메모 저장"}
                          </button>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {busy && (
            <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
              <div style={{width:30,height:30,borderRadius:9,flexShrink:0,background:"linear-gradient(135deg,"+t.ACC+","+t.PUR+")",display:"flex",alignItems:"center",justifyContent:"center",marginTop:2,overflow:"hidden"}}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="6" width="14" height="10" rx="3" fill="white" opacity=".95"/>
                    <rect x="7" y="9" width="2" height="2" rx="1" fill="#7FC8F8"/>
                    <rect x="11" y="9" width="2" height="2" rx="1" fill="#7FC8F8"/>
                    <rect x="7.5" y="12" width="5" height="1.2" rx=".6" fill="#7FC8F8"/>
                    <rect x="8.5" y="3" width="3" height="3" rx="1" fill="white" opacity=".85"/>
                    <rect x="9.6" y="2" width=".8" height="1.5" rx=".4" fill="white" opacity=".7"/>
                    <rect x="1" y="9" width="2" height="4" rx="1" fill="white" opacity=".7"/>
                    <rect x="17" y="9" width="2" height="4" rx="1" fill="white" opacity=".7"/>
                  </svg>
                </div>
              <div>
                <div style={{color:t.T2,fontSize:10.5,fontWeight:600,marginBottom:4,paddingLeft:2}}>QX Assistant</div>
                <div style={{background:t.SURF,border:"1px solid "+t.BDR,borderRadius:"4px 14px 14px 14px",padding:"12px 16px",display:"flex",gap:5,alignItems:"center"}}>
                  {[0,1,2].map(function(i){return <div key={i} style={{width:6,height:6,borderRadius:"50%",background:t.ACC,animation:"qBlink 1.2s "+i*.2+"s infinite"}}/>;  })}
                  <span style={{color:t.T3,fontSize:11,marginLeft:4}}>답변 생성 중...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={endRef}/>
        </div>
      </div>
      {msgs.length<=1 && (
        <div style={{padding:"0 20px 12px",display:"flex",flexWrap:"wrap",gap:7,maxWidth:760,margin:"0 auto",width:"100%"}}>
          {QUICK.map(function(q){
            return (
              <button key={q} onClick={function(){send(q);}} style={{background:t.SURF,border:"1px solid "+t.BDR,color:t.T2,padding:"7px 14px",borderRadius:9,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:6,boxShadow:t.isDark?"none":"0 1px 4px rgba(0,0,0,.06)",transition:"border-color .15s"}}>
                <span style={{fontSize:13}}>⚛</span>
                <span>{q}</span>
              </button>
            );
          })}
        </div>
      )}
      {activeTutorial && activeLessonIdx!==null && (
        <TutorialNavBar tutorial={activeTutorial} lessonIdx={activeLessonIdx} onPrev={onPrevLesson} onNext={onNextLesson} onQuiz={onQuiz}/>
      )}
      <div style={{borderTop:"1px solid "+t.BDR,background:t.SURF,flexShrink:0,transition:"background .25s"}}>
        <div style={{maxWidth:760,margin:"0 auto",padding:"10px 24px 14px"}}>
          {BTNS.length > 0 && (
            <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:8}}>
              {BTNS.map(function(b) {
                return (
                  <button key={b.label} onClick={function(){send(b.prompt);}} style={{background:b.clr+"18",border:"1px solid "+b.clr+"55",color:b.clr,padding:"5px 14px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                    {b.label}
                  </button>
                );
              })}
            </div>
          )}
          <div>
            <div style={{position:"relative"}}>
              <textarea value={inp} onChange={function(e){setInp(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder={chatMode==="search"?"AI와 대화하며 자료를 탐색하세요... (예: Grover 알고리즘 입문 자료 찾아줘)":activeSources.length>0?(activeSources.length===1?'"'+activeSources[0].title+'" 자료를 기반으로 질문하세요...':"자료 "+activeSources.length+"개 선택됨 — 질문하거나 비교를 요청하세요..."):curLesson?curLesson.title+" — 질문하거나 다음 단계를 요청하세요...":"자료를 선택하거나 회로 생성, 개념 설명을 요청해보세요..."} rows={2} style={{width:"100%",background:t.isDark?t.BG:t.CARDH,border:"1px solid "+t.BDRH,borderRadius:10,color:t.T1,padding:"11px 44px 44px 14px",fontSize:13,outline:"none",resize:"none",fontFamily:"inherit",lineHeight:1.6,boxSizing:"border-box"}}/>
              <button onClick={function(){send();}} disabled={busy||!inp.trim()} style={{position:"absolute",bottom:8,right:8,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",background:busy||!inp.trim()?"transparent":"linear-gradient(135deg,"+t.ACC+","+t.PUR+")",color:busy||!inp.trim()?t.T3:"#fff",border:"1px solid "+(busy||!inp.trim()?t.BDR:t.ACC),borderRadius:7,fontSize:14,cursor:busy||!inp.trim()?"default":"pointer",transition:"all .2s",flexShrink:0}}>
                {busy?"…":"↵"}
              </button>
            </div>
            {inp.length>0 && <div style={{display:"flex",justifyContent:"flex-end",paddingTop:3,gap:8}}>
              <span style={{color:t.T3,fontSize:9.5}}>{inp.length}자</span>
              <span style={{color:t.T3,fontSize:9.5,opacity:.5}}>Shift+Enter 줄바꿈</span>
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── RIGHT CIRCUIT + SIMULATION ─────────── */
function circuitToCode(circuit) {
  var lines = ["from qiskit import QuantumCircuit", "qc = QuantumCircuit(3)", ""];
  var hasMeasure = false;
  for (var t=0; t<ST; t++) {
    for (var q=0; q<QN; q++) {
      var g = circuit[q][t];
      if (!g) continue;
      if (g==="M") { hasMeasure=true; continue; }
      if (g==="H") lines.push("qc.h("+q+")");
      else if (g==="X") lines.push("qc.x("+q+")");
      else if (g==="Y") lines.push("qc.y("+q+")");
      else if (g==="Z") lines.push("qc.z("+q+")");
      else if (g==="S") lines.push("qc.s("+q+")");
      else if (g==="T") lines.push("qc.t("+q+")");
      else if (g==="CX") { var tgt=q+1<QN?q+1:q-1; lines.push("qc.cx("+q+", "+tgt+")"); }
    }
  }
  if (hasMeasure) lines.push("qc.measure_all()");
  return lines.join("\n");
}

function codeToCircuit(code) {
  var rows = mkCkt();
  var tSlot = 0;
  var lines = code.split("\n");
  for (var i=0; i<lines.length && tSlot<ST; i++) {
    var line = lines[i].trim();
    var m1 = line.match(/qc\.(h|x|y|z|s|t)\((\d)\)/i);
    if (m1) { var gId=m1[1].toUpperCase(), q=parseInt(m1[2]); if(q<QN){rows[q][tSlot]=gId;tSlot++;} continue; }
    var m2 = line.match(/qc\.cx\((\d),\s*(\d)\)/);
    if (m2) { var ctrl=parseInt(m2[1]); if(ctrl<QN){rows[ctrl][tSlot]="CX";tSlot++;} continue; }
    if (line.indexOf("measure_all()")>=0 && tSlot<ST) {
      for (var qq=0; qq<QN; qq++) rows[qq][tSlot]="M";
      tSlot++;
    }
  }
  return rows;
}

function RightCircuit(props) {
  var t = useT();
  var circuit = props.circuit;
  var setCircuit = props.setCircuit;
  var onSubmit = props.onSubmit;
  var savedMsgs = props.savedMsgs || [];
  var onUnsave = props.onUnsave;
  var onShareNote = props.onShareNote || function(){};
  var onAddNote = props.onAddNote;
  var onSaveCircuit = props.onSaveCircuit;
  var onDeleteCircuit = props.onDeleteCircuit;
  var circuits = props.circuits || [];
  var chatMsgs = props.chatMsgs || [];
  var onSaveOutput = props.onSaveOutput || function(){};
  var onSimTrigger = props.onSimTrigger || function(){};
  var simTrigger = props.simTrigger || 0;
  var gates = GATE_DEFS(t);
  var gById = function(id) { return gates.find(function(g){return g.id===id;}); };
  var [sel, setSel] = useState("H");
  var [splitY, setSplitY] = useState(50);
  var [showDebug, setShowDebug] = useState(false);
  var splitRef = useRef(null);
  var [mode, setMode] = useState("visual");
  var [rightPage, setRightPage] = useState("list");
  var [editingTitle, setEditingTitle] = useState("");
  var [editingCircuitId, setEditingCircuitId] = useState(null);
  var [savingOpen, setSavingOpen] = useState(false);
  var [savingName, setSavingName] = useState("");
  var [memoPage, setMemoPage] = useState(null);
  var [noteOpen, setNoteOpen] = useState(false);
  var [noteView, setNoteView] = useState("list");
  var [noteRef, setNoteRef] = useState([]);
  var [graphZoom, setGraphZoom] = useState(1);
  var [graphHover, setGraphHover] = useState(null);
  var [noteText, setNoteText] = useState("");
  var [generating, setGenerating] = useState(null);
  var [pendingAction, setPendingAction] = useState(null);
  var [selectedIds, setSelectedIds] = useState([]);
  var [codeText, setCodeText] = useState("from qiskit import QuantumCircuit\nqc = QuantumCircuit(3)\n");
  var selG = gById(sel);
  var hasCircuit = circuit.some(function(r){return r.some(function(g){return !!g;});});
  var gc = circuit.reduce(function(s,r){return s+r.filter(Boolean).length;},0);
  var circDep = 0;
  circuit[0].forEach(function(cell, i) { if (circuit.some(function(r){return !!r[i];})) circDep = i+1; });
  var usedQ = circuit.filter(function(r){return r.some(Boolean);}).length;
  var hasCx = circuit.some(function(r){return r.indexOf("CX")>=0;});

  function toggle(q,s) {
    if (onSetCircuitSource) onSetCircuitSource({type:"manual"});
    setCircuit(function(prev) {
      var next = prev.map(function(r){return r.slice();});
      next[q][s] = next[q][s]===sel?null:sel;
      return next;
    });
  }

  function circuitToDesc(circ, ttl) {
    var gs=[]; circ.forEach(function(row,q){row.forEach(function(cell,ti){if(cell)gs.push("q["+q+"]@t"+ti+":"+cell);});});
    var gc=circ.reduce(function(s,r){return s+r.filter(Boolean).length;},0);
    var dep=0; circ[0].forEach(function(cell,i){if(circ.some(function(r){return !!r[i];}))dep=i+1;});
    return (ttl||"현재 회로")+" ("+gc+"게이트, 깊이"+dep+")\n게이트: "+(gs.join(", ")||"없음");
  }
  function chatToText(ms) {
    return ms.filter(function(m){return m.role&&m.content;}).slice(-20).map(function(m){
      return (m.role==="user"?"사용자":"AI")+": "+m.content.replace(/\*\*/g,"").slice(0,400);
    }).join("\n---\n");
  }
  var OUTPUT_LABELS={"summary":"대화 요약","mindmap":"개념 마인드맵","circuit-analysis":"회로 분석","circuit-compare":"회로 비교","experiment":"실험 보고서"};
  function generateOutput(type, ids) {
    if (type==="note") { setNoteOpen(true); setNoteText(""); setPendingAction(null); return; }
    if (type==="summary"||type==="mindmap"||type==="glossary") {
      setPendingAction(null);
    } else {
      setPendingAction(null); setSelectedIds([]);
    }
    setGenerating(type);
    var now=new Date(); var hhmm=now.getHours().toString().padStart(2,"0")+":"+now.getMinutes().toString().padStart(2,"0");
    var sys="양자 컴퓨팅 학습 어시스턴트. 응답 첫 줄에 반드시 'TITLE: {구체적이고 짧은 제목}'을 쓰고, 빈 줄 하나 후 본문을 한국어 마크다운으로 작성하세요.";
    var prompt;
    var basis="";
    var msgCount=chatMsgs.filter(function(m){return m.role;}).length;
    if (type==="summary") { prompt="다음 학습 대화를 ## 대화 요약 제목으로 시작해 bullet(•) 5개 이내 핵심 요약:\n\n"+chatToText(chatMsgs); basis="전체 대화"; }
    else if (type==="mindmap") { prompt="다음 대화의 양자 컴퓨팅 핵심 개념을 ## 개념 마인드맵 제목으로 들여쓰기 텍스트 마인드맵 정리:\n\n"+chatToText(chatMsgs); basis="전체 대화"; }
    else if (type==="glossary") { prompt="다음 대화에서 등장한 양자 컴퓨팅 용어를 ## 용어 정리 제목으로 시작해 각 용어를 **용어**: 설명 형식으로 정리해줘:\n\n"+chatToText(chatMsgs); basis="전체 대화"; }
    else if (type==="circuit-analysis") {
      var c1=circuits.find(function(c){return c.id===ids[0];});
      if (!c1) { setGenerating(null); return; }
      prompt="다음 양자 회로를 ## 회로 분석 제목으로 동작 원리·최종 상태·활용 맥락 분석:\n\n"+circuitToDesc(c1.circuit,c1.title);
      basis="⚛ "+c1.title;
    } else if (type==="circuit-compare") {
      var selCs=ids.map(function(id){return circuits.find(function(c){return c.id===id;});}).filter(Boolean);
      if (selCs.length<2) { setGenerating(null); return; }
      prompt="다음 양자 회로들을 ## 회로 비교 제목으로 게이트 구성·목적·결과 차이 비교 분석:\n\n"+selCs.map(function(c,i){return "[회로 "+(i+1)+"]\n"+circuitToDesc(c.circuit,c.title);}).join("\n\n");
      basis="⚛ "+selCs.map(function(c){return c.title;}).join(" · ");
    } else if (type==="experiment") {
      var ec=circuits.find(function(c){return c.id===ids[0];});
      if (!ec) { setGenerating(null); return; }
      prompt="회로와 학습 대화로 ## 실험 보고서 제목으로 실험 목적·회로 구성·관찰 결과·배운 점 작성:\n\n[회로]\n"+circuitToDesc(ec.circuit,ec.title)+"\n\n[대화]\n"+chatToText(chatMsgs.slice(-10));
      basis="⚛ "+ec.title+" · 대화";
    }
    callClaude([{role:"user",content:prompt}],sys).then(function(rep){
      var titleMatch=rep.match(/^TITLE:\s*(.+)/);
      var aiTitle=titleMatch?titleMatch[1].trim():OUTPUT_LABELS[type];
      var body=rep.replace(/^TITLE:.*\n?/,"").trimStart();
      onSaveOutput({id:"out_"+Date.now(),type:type,title:aiTitle,content:body,time:hhmm,basis:basis});
      setGenerating(null);
    }).catch(function(){
      onSaveOutput({id:"out_"+Date.now(),type:type,title:OUTPUT_LABELS[type],content:"생성 중 오류가 발생했습니다.",time:hhmm,basis:basis});
      setGenerating(null);
    });
  }

  var circuitSource = props.circuitSource;
  var onSetCircuitSource = props.onSetCircuitSource;
  var onAskChat = props.onAskChat || function(){};

  function loadSample(fn, label) {
    var c = fn();
    setCircuit(c);
    setCodeText(circuitToCode(c));
    if (onSetCircuitSource) onSetCircuitSource({type:"sample", label:label});
  }

  function dragSplit(e) {
    e.preventDefault();
    if (!splitRef.current) return;
    var rect = splitRef.current.getBoundingClientRect();
    function mv(ev) {
      var pos = ev.clientY - rect.top;
      var pct = Math.round(Math.max(15, Math.min(85, pos/rect.height*100)));
      setSplitY(pct);
    }
    function up() { document.removeEventListener('mousemove',mv); document.removeEventListener('mouseup',up); }
    document.addEventListener('mousemove',mv);
    document.addEventListener('mouseup',up);
  }

  function switchToCode() {
    setCodeText(circuitToCode(circuit));
    setMode("code");
  }

  function applyCode() {
    var rows = codeToCircuit(codeText);
    setCircuit(rows);
    setMode("visual");
  }


  return (
    <div style={{width:(props.panelWidth||360),flexShrink:0,borderLeft:"1px solid "+t.BDR,background:t.SURF,display:"flex",flexDirection:"column",transition:"background .25s",overflow:"hidden"}}>
    {/* ─── Splittable area ─── */}
    <div ref={splitRef} style={{flex:1,minHeight:0,display:"flex",flexDirection:"column",overflow:"hidden"}}>
    {/* TOP HALF: Circuit Editor */}
    <div style={{height:splitY+"%",minHeight:"15%",display:"flex",flexDirection:"column",overflow:"hidden"}}>

      {/* ── Header ── */}
      <div style={{padding:"0 14px",borderBottom:"1px solid "+t.BDR,flexShrink:0,display:"flex",alignItems:"center",gap:8,height:40}}>
        {rightPage==="list" ? (
          <>
            <span style={{color:t.T1,fontWeight:600,fontSize:13}}>회로 에디터</span>
            {circuits.length>0 && <span style={{background:t.ACC+"18",border:"1px solid "+t.ACC+"44",color:t.ACC,borderRadius:10,padding:"1px 7px",fontSize:10,fontWeight:700}}>{circuits.length}</span>}
            <button onClick={function(){setCircuit(mkCkt());setEditingTitle("회로 작성");setEditingCircuitId(null);setRightPage("editor");if(onSetCircuitSource)onSetCircuitSource({type:"manual"});}} style={{marginLeft:"auto",background:"linear-gradient(135deg,"+t.ACC+","+t.PUR+")",color:"#fff",border:"none",padding:"0 10px",borderRadius:7,fontSize:10.5,fontWeight:500,cursor:"pointer",height:20}}>+ 회로 작성</button>
          </>
        ) : (
          <>
            <button onClick={function(){setRightPage("list");setSavingOpen(false);}} style={{background:"transparent",border:"none",color:t.ACC,fontSize:12,cursor:"pointer",padding:0,fontWeight:600,display:"flex",alignItems:"center",gap:3,flexShrink:0}}>← 목록</button>
            <div style={{width:1,height:18,background:t.BDR,flexShrink:0}}/>
            <div style={{display:"flex",alignItems:"center",gap:5,flex:1,minWidth:0}}>
              <span style={{color:t.T2,fontSize:12,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{editingTitle||"회로 에디터"}</span>
              {circuitSource && (function(){
                var cfg = circuitSource.type==="ai"
                  ? {icon:"🔖", label:"AI 응답", clr:t.PUR}
                  : circuitSource.type==="sample"
                  ? {icon:"⚛", label:circuitSource.label||"샘플", clr:t.ACC}
                  : {icon:"✏️", label:"직접 작성", clr:t.T3};
                return <span style={{background:cfg.clr+"12",border:"1px solid "+cfg.clr+"33",color:cfg.clr,padding:"1px 6px",borderRadius:5,fontSize:9,fontWeight:600,whiteSpace:"nowrap",flexShrink:0}}>{cfg.icon} {cfg.label}</span>;
              })()}
            </div>

            {editingCircuitId && onDeleteCircuit && (
              <button onClick={function(){onDeleteCircuit(editingCircuitId);setRightPage("list");setEditingCircuitId(null);}} style={{background:"transparent",border:"1px solid "+t.RED+"55",color:t.RED,padding:"3px 9px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>삭제</button>
            )}
            <button onClick={onSubmit} style={{background:hasCircuit?"linear-gradient(135deg,"+t.ACC+","+t.PUR+")":"transparent",color:hasCircuit?"#fff":t.T3,border:hasCircuit?"none":"1px solid "+t.BDR,padding:"0 10px",borderRadius:7,fontSize:10.5,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:3,flexShrink:0,height:20}}>
              <span>⚡</span>제출
            </button>
          </>
        )}
      </div>

      {/* ── 모드 토글 (에디터 전용) ── */}
      {rightPage==="editor" && (
        <div style={{display:"flex",justifyContent:"center",padding:"6px 14px 0",flexShrink:0}}>
          <div style={{display:"flex",background:t.isDark?t.BG:t.CARDH,borderRadius:8,padding:2,gap:2}}>
            <button onClick={function(){if(mode==="code"){setCircuit(codeToCircuit(codeText));}setMode("visual");}} style={{padding:"3px 14px",borderRadius:6,border:"none",fontSize:11,fontWeight:mode==="visual"?700:400,cursor:"pointer",background:mode==="visual"?t.SURF:"transparent",color:mode==="visual"?t.ACC:t.T2,transition:"all .18s",display:"flex",alignItems:"center",gap:3}}>⚛ 컴포저</button>
            <button onClick={function(){setCodeText(circuitToCode(circuit));setMode("code");}} style={{padding:"3px 14px",borderRadius:6,border:"none",fontSize:11,fontWeight:mode==="code"?700:400,cursor:"pointer",background:mode==="code"?t.SURF:"transparent",color:mode==="code"?t.PUR:t.T2,transition:"all .18s",display:"flex",alignItems:"center",gap:3}}>{"</>"} 코드</button>
          </div>
        </div>
      )}

      {/* ── 회로 목록 뷰 ── */}
      {rightPage==="list" && (
        <div style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:8}}>
          {circuits.length===0 ? (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:10}}>
              <div style={{fontSize:32,opacity:.3}}>⚛</div>
              <div style={{color:t.T3,fontSize:11.5,textAlign:"center",lineHeight:1.8}}>
                채팅에서 회로가 생성되면<br/>여기에 자동으로 저장됩니다
              </div>
            </div>
          ) : circuits.map(function(c) {
            var gc = c.circuit ? c.circuit.reduce(function(s,r){return s+r.filter(Boolean).length;},0) : 0;
            var hasCx = c.circuit ? c.circuit.some(function(r){return r.indexOf("CX")>=0;}) : false;
            var cDep = 0; if(c.circuit) c.circuit[0].forEach(function(cell,i){if(c.circuit.some(function(r){return !!r[i];}))cDep=i+1;});
            var usedQ = c.circuit ? c.circuit.filter(function(r){return r.some(Boolean);}).length : 0;
            return (
              <div key={c.id} onClick={function(){setCircuit(c.circuit);setEditingTitle(c.title);setEditingCircuitId(c.id);setRightPage("editor");onSimTrigger();if(onSetCircuitSource&&c.source)onSetCircuitSource(c.source);}} style={{background:t.isDark?t.CARD:"transparent",border:"1px solid "+t.BDR,borderRadius:10,padding:"10px 12px",cursor:"pointer",display:"flex",flexDirection:"column",gap:3,transition:"border-color .15s",marginBottom:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:14,flexShrink:0}}>⚛</span>
                  <span style={{flex:1,color:t.T1,fontSize:12,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.title}</span>
                  {c.source && (function(){
                    var cfg = c.source.type==="ai"
                      ? {icon:"🔖", label:"AI 응답", clr:t.PUR}
                      : c.source.type==="sample"
                      ? {icon:"⚛", label:c.source.label||"샘플", clr:t.ACC}
                      : {icon:"✏️", label:"직접 작성", clr:t.T3};
                    return <span style={{background:cfg.clr+"12",border:"1px solid "+cfg.clr+"33",color:cfg.clr,padding:"1px 6px",borderRadius:5,fontSize:9,fontWeight:600,flexShrink:0,whiteSpace:"nowrap"}}>{cfg.icon} {cfg.label}</span>;
                  })()}
                  <span style={{color:t.T3,fontSize:11,flexShrink:0}}>›</span>
                </div>
                {c.circuit && (
                  <div style={{display:"flex",flexDirection:"column",gap:2,paddingLeft:22,marginTop:5}}>
                    {c.circuit.filter(function(row){return row.some(Boolean);}).slice(0,2).map(function(row,q) {
                      return (
                        <div key={q} style={{display:"flex",alignItems:"center",gap:1}}>
                          <span style={{color:t.ACC,fontSize:8,width:20,textAlign:"right",paddingRight:3}}>q[{q}]</span>
                          {row.slice(0,6).map(function(cell,s) {
                            var g = cell?GATE_DEFS(t).find(function(x){return x.id===cell;}):null;
                            return <div key={s} style={{width:14,height:11,borderRadius:2,background:g?g.clr+"20":"transparent",border:"1px solid "+(g?g.clr:t.T3+"22"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:6.5,fontWeight:g?800:400,color:g?g.clr:t.T3}}>{g?g.lbl:"─"}</div>;
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
                <div style={{display:"flex",alignItems:"center",gap:6,paddingLeft:22,marginTop:8}}>
                  <span style={{color:t.T3,fontSize:9.5}}>{gc}게이트</span>
                  <span style={{color:t.T3,fontSize:9.5,opacity:.4}}>·</span>
                  <span style={{color:t.T3,fontSize:9.5}}>깊이 {cDep}</span>
                  <span style={{color:t.T3,fontSize:9.5,opacity:.4}}>·</span>
                  <span style={{color:t.T3,fontSize:9.5}}>{usedQ}/{QN}큐비트</span>
                  {hasCx && <><span style={{color:t.T3,fontSize:9.5,opacity:.4}}>·</span><span style={{color:t.T3,fontSize:9,letterSpacing:".04em"}}>Entangled</span></>}
                  <span style={{flex:1}}/>
                  {c.savedAt && <span style={{color:t.T3,fontSize:9.5}}>{c.savedDate?c.savedDate+" ":""}{c.savedAt}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 에디터 콘텐츠 (목록 뷰 숨김) ── */}
      {/* ── Visual mode: Gate palette ── */}
      {rightPage==="editor" && mode==="visual" && (
        <div style={{padding:"8px 14px",borderBottom:"1px solid "+t.BDR,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:7}}>
            <div style={{color:t.T3,fontSize:9.5,letterSpacing:".08em",textTransform:"uppercase",flex:1}}>게이트</div>
            <button onClick={function(){setCircuit(mkCkt());}} style={{background:"transparent",border:"1px solid "+t.BDR,color:t.T3,padding:"2px 7px",borderRadius:5,fontSize:10,cursor:"pointer"}}>초기화</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:4}}>
            {gates.map(function(g) {
              var isSel = sel===g.id;
              return (
                <button key={g.id} onClick={function(){setSel(g.id);}} title={g.desc} style={{padding:"7px 4px",borderRadius:8,border:"1.5px solid "+(isSel?g.clr:t.BDR),background:isSel?g.clr+"15":(t.isDark?t.CARD:t.CARDH),cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all .18s",boxShadow:isSel?(t.isDark?"0 0 8px "+g.clr+"33":"0 2px 8px "+g.clr+"22"):"none"}}>
                  <span style={{color:g.clr,fontWeight:900,fontSize:14,lineHeight:1}}>{g.lbl}</span>
                  <span style={{color:isSel?g.clr:t.T3,fontSize:8.5,fontWeight:500,letterSpacing:".02em"}}>{g.id==="CX"?"CNOT":g.id==="M"?"측정":g.id}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Main content area ── */}
      {rightPage==="editor" && <div style={{flex:1,overflow:mode==="code"?"hidden":"auto",display:"flex",flexDirection:"column"}}>

        {/* Visual: circuit grid */}
        {rightPage==="editor" && mode==="visual" && (
          <div style={{flex:1,overflowY:"auto"}}><div style={{padding:"12px 14px"}}>
            <div style={{display:"grid",gridTemplateColumns:"44px repeat("+ST+",1fr)",gap:3,marginBottom:4}}>
              <div/>
              {Array.from({length:ST},function(_,i){return <div key={i} style={{textAlign:"center",color:t.T3,fontSize:9.5}}>t{i}</div>;})}
            </div>
            {circuit.map(function(row,q) {
              return (
                <div key={q} style={{display:"grid",gridTemplateColumns:"44px repeat("+ST+",1fr)",gap:3,marginBottom:3,alignItems:"center"}}>
                  <div style={{color:t.ACC,fontSize:11.5,fontWeight:700,textAlign:"right",paddingRight:8}}>q[{q}]</div>
                  {row.map(function(cell,s) {
                    var g = cell?gById(cell):null;
                    return (
                      <div key={s} onClick={function(){toggle(q,s);}} style={{height:32,borderRadius:6,cursor:"pointer",transition:"all .15s",border:"1px solid "+(g?g.clr:t.BDR),background:g?g.clr+"18":(t.isDark?t.CARD:t.CARDH),display:"flex",alignItems:"center",justifyContent:"center",boxShadow:g?(t.isDark?"0 0 6px "+g.clr+"28":"0 1px 4px "+g.clr+"22"):"none"}}>
                        {g?<span style={{color:g.clr,fontWeight:900,fontSize:12}}>{g.lbl}</span>:<div style={{width:"100%",height:1,background:t.T3+"88"}}/>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            <div style={{display:"flex",alignItems:"center",gap:4,marginTop:10}}>
              <button onClick={function(){setCircuit(function(p){return p.length<=1?p:p.slice(0,-1);});}} disabled={circuit.length<=1} style={{width:24,height:24,borderRadius:5,border:"1px solid "+t.BDR,background:"transparent",color:t.T2,fontSize:14,fontWeight:700,cursor:circuit.length<=1?"default":"pointer",opacity:circuit.length<=1?0.3:1,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>−</button>
              <button onClick={function(){setCircuit(function(p){return p.length>=6?p:p.concat([Array(ST).fill(null)]);});}} disabled={circuit.length>=6} style={{width:24,height:24,borderRadius:5,border:"1px solid "+t.BDR,background:"transparent",color:t.T2,fontSize:14,fontWeight:700,cursor:circuit.length>=6?"default":"pointer",opacity:circuit.length>=6?0.3:1,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>+</button>
              <div style={{display:"flex",alignItems:"center",gap:0,color:t.T3,fontSize:10,marginLeft:6}}>
                <span style={{color:t.T2,fontWeight:600}}>{gc}</span><span style={{marginLeft:2}}>게이트</span>
                <span style={{margin:"0 6px",opacity:.35}}>·</span>
                <span style={{color:t.T2,fontWeight:600}}>{circDep}</span><span style={{marginLeft:2}}>깊이</span>
                <span style={{margin:"0 6px",opacity:.35}}>·</span>
                <span style={{color:t.T2,fontWeight:600}}>{usedQ}/{circuit.length}</span><span style={{marginLeft:2}}>큐비트</span>
                {hasCx && <span style={{marginLeft:8,color:t.T3,fontSize:9,letterSpacing:".04em"}}>Entangled</span>}
              </div>
            </div>
          </div></div>
        )}

        {/* Code: full-area textarea, no apply button */}
        {rightPage==="editor" && mode==="code" && (
          <div style={{flex:1,display:"flex",flexDirection:"column",padding:"10px 14px 0"}}>
            <div style={{color:t.T3,fontSize:9.5,marginBottom:6,letterSpacing:".06em",textTransform:"uppercase"}}>Qiskit 코드 · 탭 전환 시 자동 동기화</div>
            <textarea value={codeText} onChange={function(e){setCodeText(e.target.value);}} spellCheck={false} style={{flex:1,width:"100%",background:t.isDark?t.BG:t.CARDH,border:"1px solid "+t.BDRH,borderRadius:9,color:t.isDark?"#A8E6CF":t.T1,padding:"12px",fontSize:12.5,fontFamily:"'JetBrains Mono','Fira Code',monospace",lineHeight:1.7,outline:"none",resize:"none",boxSizing:"border-box"}}/>
            <div style={{color:t.T3,fontSize:10,padding:"6px 0 10px",lineHeight:1.6}}>
              qc.h(q) · qc.x(q) · qc.cx(c,t) · qc.measure_all()
            </div>
          </div>
        )}
      </div>}

      {/* ── 디버깅 ── */}
      {rightPage==="editor" && (
        <div style={{borderTop:"1px solid "+t.BDR,flexShrink:0}}>
          <div onClick={function(){setShowDebug(function(v){return !v;});}} style={{padding:"0 14px",height:40,display:"flex",alignItems:"center",background:t.isDark?t.CARD:t.CARDH,cursor:"pointer",userSelect:"none",...(showDebug?{borderBottom:"1px solid "+t.BDR}:{})}}>
            <div style={{display:"flex",alignItems:"center",gap:6,flex:1}}>
              <span style={{color:t.T3,fontSize:10,transition:"transform .15s",display:"inline-block",transform:showDebug?"rotate(90deg)":"rotate(0deg)"}}>›</span>
              <span style={{fontSize:10,color:t.T3}}>🐞</span>
              <span style={{color:t.T1,fontWeight:600,fontSize:11.5}}>디버깅</span>
            </div>
            <button onClick={function(e){
              e.stopPropagation();
              var gs=[]; circuit.forEach(function(row,q){row.forEach(function(cell,ti){if(cell)gs.push("q["+q+"]@t"+ti+":"+cell);});});
              var desc=(editingTitle||"현재 회로")+" ("+gc+"게이트, 깊이"+circDep+")\n게이트: "+(gs.join(", ")||"없음");
              onAskChat("이 회로를 디버깅해줘:\n\n"+desc);
            }} style={{background:"linear-gradient(135deg,"+t.ACC+"22,"+t.PUR+"22)",border:"1px dashed "+t.ACC+"55",color:t.ACC,borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>✦ AI에게 물어보기</button>
          </div>
          {showDebug && (
            <div style={{padding:"10px 14px 12px",color:t.T3,fontSize:11}}>
              회로를 AI에게 보내 오류나 개선점을 확인하세요.
            </div>
          )}
        </div>
      )}

      {/* ── Simulation ── */}
      {rightPage==="editor" && <SimulationSection circuit={circuit} circuits={circuits}/>}
    </div>{/* end top half */}

    {/* ─── Horizontal drag handle ─── */}
    <div onMouseDown={dragSplit} style={{height:8,flexShrink:0,cursor:"row-resize",display:"flex",alignItems:"center",justifyContent:"center",background:t.isDark?t.CARD:t.CARDH,borderTop:"1px solid "+t.BDR,borderBottom:"1px solid "+t.BDR,userSelect:"none"}}>
      <div style={{width:36,height:3,borderRadius:2,background:t.isDark?"#2A3F6F":"#BCC8E0"}}/>
    </div>

    {/* BOTTOM HALF: 메모 */}
    <div style={{height:(100-splitY)+"%",minHeight:"10%",display:"flex",flexDirection:"column",overflow:"hidden",background:t.SURF}}>

      {/* ── 상세 페이지 ── */}
      {memoPage ? (
        (function(){
          var mMeta={"note":{label:"직접 메모",icon:"✏️",clr:t.GRN},"ai-msg":{label:"AI 응답",icon:"🔖",clr:t.PUR},"summary":{label:"대화 요약",icon:"📝",clr:t.ACC},"glossary":{label:"용어 정리",icon:"📖",clr:t.AMB},"mindmap":{label:"개념 마인드맵",icon:"🗺️",clr:t.PUR},"circuit-analysis":{label:"회로 분석",icon:"🔬",clr:t.GRN},"circuit-compare":{label:"회로 비교",icon:"📊",clr:t.PUR},"experiment":{label:"실험 보고서",icon:"📋",clr:t.RED}};
          var mm=mMeta[memoPage.type]||mMeta["ai-msg"];
          return (
            <div style={{display:"flex",flexDirection:"column",height:"100%",padding:14,boxSizing:"border-box"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,flexShrink:0}}>
                <button onClick={function(){setMemoPage(null);}} style={{background:"transparent",border:"none",color:t.ACC,fontSize:13,cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:4,fontWeight:600}}>← 뒤로</button>
                <span style={{flex:1}}/>
                <button onClick={function(){onShareNote(memoPage.id);setMemoPage(function(p){return Object.assign({},p,{shared:!p.shared});});}} style={{background:memoPage.shared?t.GRN+"18":"transparent",border:"1px solid "+(memoPage.shared?t.GRN+"55":t.BDR),color:memoPage.shared?t.GRN:t.T2,padding:"3px 9px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                  {memoPage.shared?"공유 취소":"팀에 공유"}
                </button>
                <button onClick={function(){if(onUnsave)onUnsave(memoPage.id);setMemoPage(null);}} style={{background:"transparent",border:"1px solid "+t.RED+"55",color:t.RED,padding:"3px 9px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer"}}>삭제</button>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexShrink:0}}>
                <span style={{fontSize:18}}>{mm.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:t.T1,fontWeight:700,fontSize:12.5,lineHeight:1.3}}>{memoPage.title||mm.label}</div>
                  <div style={{color:t.T3,fontSize:10,marginTop:2,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    <span style={{background:mm.clr+"12",border:"1px solid "+mm.clr+"33",color:mm.clr,padding:"0px 6px",borderRadius:5,fontSize:9,fontWeight:600}}>{mm.label}</span>
                    {memoPage.time && <span>{memoPage.time}</span>}
                    {memoPage.basis && <><span style={{opacity:.4}}>·</span><span style={{color:t.T2,fontSize:9.5}}>{memoPage.basis}</span></>}
                  </div>
                </div>
              </div>
              <div style={{flex:1,overflowY:"auto",background:t.isDark?t.BG:t.CARDH,border:"1px solid "+t.BDR,borderRadius:8,padding:10,fontSize:11.5,lineHeight:1.8,color:t.T2}} dangerouslySetInnerHTML={{__html:renderMD(memoPage.content,t.ACC)}}/>
            </div>
          );
        })()

      ) : noteOpen ? (
        <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
          <div style={{padding:"0 12px",minHeight:40,display:"flex",alignItems:"center",gap:8,flexShrink:0,borderBottom:"1px solid "+t.BDR}}>
            <button onClick={function(){setNoteOpen(false);setNoteText("");}} style={{background:"transparent",border:"none",color:t.ACC,fontSize:12,cursor:"pointer",padding:0,fontWeight:600,display:"flex",alignItems:"center",gap:3}}>← 뒤로</button>
            <span style={{flex:1}}/>
            <button onClick={function(){if(onAddNote&&noteText.trim()){onAddNote(noteText,noteRef);setNoteText("");setNoteRef([]);setNoteOpen(false);}}} disabled={!noteText.trim()} style={{background:"transparent",border:"none",color:noteText.trim()?t.ACC:t.T3,fontSize:12,cursor:noteText.trim()?"pointer":"default",padding:0,fontWeight:600,opacity:noteText.trim()?1:0.4,transition:"opacity .15s"}}>저장</button>
          </div>
          <div style={{flex:1,padding:"12px 10px",display:"flex",flexDirection:"column",gap:8}}>
            <textarea autoFocus value={noteText} onChange={function(e){setNoteText(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter"&&e.metaKey){e.preventDefault();if(onAddNote&&noteText.trim()){onAddNote(noteText,noteRef);setNoteText("");setNoteRef([]);setNoteOpen(false);}}}} placeholder="메모 작성..." style={{flex:1,width:"100%",background:t.isDark?t.BG:t.CARDH,border:"1px solid "+(noteText.trim()?t.BDRH:t.BDR),borderRadius:8,color:t.T1,padding:"10px 12px",fontSize:12,outline:"none",resize:"none",fontFamily:"inherit",lineHeight:1.7,boxSizing:"border-box"}}/>
            {/* Reference selector */}
            <div style={{flexShrink:0,display:"flex",flexDirection:"column",gap:6}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{color:t.T3,fontSize:10,fontWeight:600}}>🔗 참조</span>
                <button onClick={function(){setNoteRef(function(r){return r.indexOf("전체 대화")>=0?r.filter(function(x){return x!=="전체 대화";}):r.concat(["전체 대화"]);});}} style={{padding:"2px 8px",borderRadius:5,border:"1px solid "+(noteRef.indexOf("전체 대화")>=0?t.ACC+"55":t.BDR),background:noteRef.indexOf("전체 대화")>=0?t.ACC+"12":"transparent",color:noteRef.indexOf("전체 대화")>=0?t.ACC:t.T3,fontSize:10,fontWeight:600,cursor:"pointer"}}>전체 대화</button>
              </div>
              {circuits.length>0 && (
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {circuits.map(function(c){
                    var key="⚛ "+c.title;
                    var sel=noteRef.indexOf(key)>=0;
                    return <button key={c.id} onClick={function(){setNoteRef(function(r){return sel?r.filter(function(x){return x!==key;}):r.concat([key]);});}} style={{padding:"2px 8px",borderRadius:5,border:"1px solid "+(sel?t.ACC+"55":t.BDR),background:sel?t.ACC+"12":"transparent",color:sel?t.ACC:t.T3,fontSize:10,fontWeight:600,cursor:"pointer",maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>⚛ {c.title}</button>;
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
      /* ── 내 노트 목록 ── */
      <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
        {/* Header */}
        <div style={{padding:"0 12px",minHeight:40,display:"flex",alignItems:"center",gap:7,flexShrink:0,borderBottom:"1px solid "+t.BDR}}>
          {pendingAction ? (
            <>
              <button onClick={function(){setPendingAction(null);setSelectedIds([]);}} style={{background:"transparent",border:"none",color:t.ACC,fontSize:12,cursor:"pointer",padding:0,fontWeight:600}}>← 뒤로</button>
              <span style={{color:t.T1,fontWeight:600,fontSize:11,marginLeft:4}}>
                {{  "circuit-analysis":"회로 분석 — 회로 선택",
                    "circuit-compare":"회로 비교 — 회로 선택 (2개 이상)",
                    "experiment":"실험 보고서 — 회로 선택"}[pendingAction]}
              </span>
            </>
          ) : (
            <>
              <span style={{color:t.T1,fontWeight:700,fontSize:12}}>내 노트</span>
              {savedMsgs.length>0 && <span style={{background:t.PUR+"18",border:"1px solid "+t.PUR+"44",color:t.PUR,padding:"1px 7px",borderRadius:10,fontSize:10,fontWeight:700}}>{savedMsgs.length}</span>}
              <span style={{flex:1}}/>
              <button onClick={function(){setNoteOpen(true);setNoteText("");setPendingAction(null);}} style={{background:"linear-gradient(135deg,"+t.ACC+","+t.PUR+")",color:"#fff",border:"none",padding:"4px 12px",borderRadius:7,fontSize:11.5,fontWeight:600,cursor:"pointer"}}>+ 메모 작성</button>
            </>
          )}
        </div>

        {/* Circuit picker — full height when active */}
        {pendingAction ? (
          <div style={{flex:1,display:"flex",flexDirection:"column",padding:"10px 12px",gap:8,overflow:"hidden"}}>
            <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
              {circuits.length===0 && <span style={{color:t.T3,fontSize:11}}>저장된 회로 없음</span>}
              {circuits.map(function(c){
                var isSel=selectedIds.indexOf(c.id)>=0;
                var gc=c.circuit?c.circuit.reduce(function(s,r){return s+r.filter(Boolean).length;},0):0;
                return (
                  <button key={c.id} onClick={function(){
                    if (pendingAction==="circuit-compare") {
                      setSelectedIds(function(p){return isSel?p.filter(function(x){return x!==c.id;}):p.concat([c.id]);});
                    } else {
                      setSelectedIds([c.id]);
                    }
                  }} style={{padding:"10px 12px",borderRadius:9,border:"1.5px solid "+(isSel?t.ACC:t.BDR),background:isSel?t.ACC+"0E":t.SURF,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:10,transition:"all .15s"}}>
                    <div style={{width:20,height:20,borderRadius:5,border:"1.5px solid "+(isSel?t.ACC:t.BDR),background:isSel?t.ACC:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {isSel && <span style={{color:"#fff",fontSize:11,fontWeight:900}}>✓</span>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{color:isSel?t.ACC:t.T1,fontWeight:600,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>⚛ {c.title}</div>
                      <div style={{color:t.T3,fontSize:10,marginTop:2}}>{gc}게이트 · {c.savedAt}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <button onClick={function(){
              var ok=pendingAction==="circuit-compare"?selectedIds.length>=2:selectedIds.length===1;
              if(ok) generateOutput(pendingAction,selectedIds);
            }} disabled={pendingAction==="circuit-compare"?selectedIds.length<2:selectedIds.length<1} style={{flexShrink:0,padding:"9px",borderRadius:8,border:"none",background:(pendingAction==="circuit-compare"?selectedIds.length>=2:selectedIds.length>=1)?"linear-gradient(135deg,"+t.ACC+","+t.PUR+")":t.BDR,color:(pendingAction==="circuit-compare"?selectedIds.length>=2:selectedIds.length>=1)?"#fff":t.T3,fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .18s"}}>
              생성
            </button>
          </div>
        ) : (
        <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>

        {/* Action grid — always visible, 3 columns */}
        <div style={{flexShrink:0,borderBottom:"1px solid "+t.BDR,background:t.isDark?t.BG:t.CARDH}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,padding:"6px 8px"}}>
              {[
                {type:"summary",          label:"대화 요약",   icon:"📝",clr:t.ACC},
                {type:"glossary",         label:"용어 정리",   icon:"📖",clr:t.AMB},
                {type:"mindmap",          label:"마인드맵",    icon:"🗺️",clr:t.PUR},
                {type:"circuit-analysis", label:"회로 분석",   icon:"🔬",clr:t.GRN},
                {type:"circuit-compare",  label:"회로 비교",   icon:"📊",clr:t.ACC},
                {type:"experiment",       label:"실험 보고서", icon:"📋",clr:t.RED},
              ].map(function(a){
                return (
                  <button key={a.type} onClick={function(){
                    if (a.type==="summary"||a.type==="mindmap"||a.type==="glossary") { generateOutput(a.type,[]); return; }
                    setPendingAction(a.type); setSelectedIds([]);
                  }} disabled={!!generating} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,padding:"7px 4px",borderRadius:8,border:"1px solid "+a.clr+"44",background:a.clr+"0D",color:a.clr,fontSize:10,fontWeight:600,cursor:generating?"default":"pointer",opacity:generating?0.5:1,transition:"all .15s",textAlign:"center",minHeight:44}}>
                    <span style={{fontSize:15}}>{a.icon}</span>
                    <span style={{lineHeight:1.2}}>{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

        {/* View toggle */}
        <div style={{display:"flex",justifyContent:"center",padding:"6px 12px",flexShrink:0}}>
          <div style={{display:"flex",background:t.isDark?t.BG:t.CARDH,borderRadius:8,padding:2,gap:2}}>
            <button onClick={function(){setNoteView("list");}} style={{padding:"3px 14px",borderRadius:6,border:"none",fontSize:11,fontWeight:noteView==="list"?700:400,cursor:"pointer",background:noteView==="list"?t.SURF:"transparent",color:noteView==="list"?t.ACC:t.T2,transition:"all .18s",display:"flex",alignItems:"center",gap:3}}><span style={{lineHeight:1,display:"flex",alignItems:"center"}}>☰</span> 목록</button>
            <button onClick={function(){setNoteView("graph");}} style={{padding:"3px 14px",borderRadius:6,border:"none",fontSize:11,fontWeight:noteView==="graph"?700:400,cursor:"pointer",background:noteView==="graph"?t.SURF:"transparent",color:noteView==="graph"?t.PUR:t.T2,transition:"all .18s",display:"flex",alignItems:"center",gap:3}}><span style={{lineHeight:1,display:"flex",alignItems:"center"}}>⚯</span> 지식 그래프</button>
          </div>
        </div>

        {/* Knowledge Graph View */}
        {noteView==="graph" && !pendingAction && (
          <div style={{flex:1,overflow:"hidden",padding:"10px 8px 8px",position:"relative"}}>
            {(function(){
              var TYPE_C={"note":t.GRN,"ai-msg":t.PUR,"summary":t.ACC,"glossary":t.AMB,"mindmap":t.PUR,"circuit-analysis":t.GRN,"circuit-compare":t.PUR,"experiment":t.RED};
              var TYPE_ICON={"note":"✏️","ai-msg":"🔖","summary":"📝","glossary":"📖","mindmap":"🗺️","circuit-analysis":"🔬","circuit-compare":"📊","experiment":"📋"};
              var W=310, H=240;
              var hubSet={};
              savedMsgs.forEach(function(n){if(!n.basis)return;n.basis.split(" · ").forEach(function(b){b=b.trim();if(b)hubSet[b]=true;});});
              var hubNames=Object.keys(hubSet);
              var cx=W/2, cy=H/2, hr=75;
              var hubPos={};
              hubNames.forEach(function(h,i){var a=(i/hubNames.length)*2*Math.PI-Math.PI/2;hubPos[h]={x:cx+hr*Math.cos(a),y:cy+hr*Math.sin(a)};});
              var basisGroups={};
              savedMsgs.forEach(function(n){var primary=n.basis?n.basis.split(" · ")[0].trim():"__standalone__";if(!basisGroups[primary])basisGroups[primary]=[];basisGroups[primary].push(n);});
              var nodePos={};
              Object.keys(basisGroups).forEach(function(basis){
                var group=basisGroups[basis];
                var center=hubPos[basis]||{x:W-22,y:22};
                group.forEach(function(n,i){var a=(i/group.length)*2*Math.PI-Math.PI/2;var r=40;nodePos[n.id]={x:Math.max(14,Math.min(W-14,center.x+r*Math.cos(a))),y:Math.max(14,Math.min(H-14,center.y+r*Math.sin(a)))};});
              });
              var edges=[];
              savedMsgs.forEach(function(n){if(!n.basis||!nodePos[n.id])return;n.basis.split(" · ").forEach(function(b){b=b.trim();if(hubPos[b])edges.push({from:nodePos[n.id],to:hubPos[b],clr:TYPE_C[n.type]||t.T3});});});
              var vbX=W/2*(1-1/graphZoom), vbY=H/2*(1-1/graphZoom), vbW=W/graphZoom, vbH=H/graphZoom;
              return (
                <>
                  <svg viewBox={vbX+" "+vbY+" "+vbW+" "+vbH} style={{width:"100%",height:"100%",display:"block"}}>
                    {edges.map(function(e,i){return <line key={i} x1={e.from.x} y1={e.from.y} x2={e.to.x} y2={e.to.y} stroke={e.clr} strokeWidth={1.2} strokeOpacity={0.25}/>;} )}
                    {hubNames.map(function(h){
                      var pos=hubPos[h];
                      var isChat=h==="전체 대화";
                      var label=h.replace("⚛ ","");
                      var words=label.split(" ");
                      return (
                        <g key={h} onMouseEnter={function(){setGraphHover({label:h,x:pos.x,y:pos.y});}} onMouseLeave={function(){setGraphHover(null);}}>
                          <circle cx={pos.x} cy={pos.y} r={20} fill={isChat?t.ACC+"1A":t.isDark?"#1a2a4a":"#e8edf8"} stroke={isChat?t.ACC:t.T3} strokeWidth={1.5} strokeDasharray={isChat?"none":"4 2"}/>
                          {words.slice(0,2).map(function(w,wi){return <text key={wi} x={pos.x} y={pos.y+(wi-(words.slice(0,2).length-1)/2)*8} textAnchor="middle" dominantBaseline="middle" fill={isChat?t.ACC:t.T2} fontSize={6.5} fontWeight={600}>{w.length>5?w.slice(0,5)+"…":w}</text>;})}
                        </g>
                      );
                    })}
                    {savedMsgs.map(function(n){
                      var pos=nodePos[n.id];
                      if(!pos)return null;
                      var clr=TYPE_C[n.type]||t.T3;
                      var icon=TYPE_ICON[n.type]||"📄";
                      var isHov=graphHover&&graphHover.label===n.id;
                      return (
                        <g key={n.id}
                          onClick={function(){setMemoPage(n);}}
                          onMouseEnter={function(){setGraphHover({label:n.title||n.id,x:pos.x,y:pos.y,isNode:true});}}
                          onMouseLeave={function(){setGraphHover(null);}}
                          style={{cursor:"pointer"}}>
                          <circle cx={pos.x} cy={pos.y} r={13} fill={clr+"1E"} stroke={clr} strokeWidth={1.5}/>
                          <text x={pos.x} y={pos.y+1} textAnchor="middle" dominantBaseline="middle" fontSize={10}>{icon}</text>
                        </g>
                      );
                    })}
                    {graphHover && (function(){
                      var px=graphHover.x, py=graphHover.y;
                      var lbl=graphHover.label;
                      var maxW=Math.min(lbl.length*5.5+16, 120);
                      var bx=px-maxW/2, by=py-32;
                      return (
                        <g style={{pointerEvents:"none"}}>
                          <rect x={bx} y={by} width={maxW} height={17} rx={4} fill={t.isDark?t.CARD:"#fff"} stroke={t.BDR} strokeWidth={0.8} opacity={0.95}/>
                          <text x={px} y={by+9} textAnchor="middle" dominantBaseline="middle" fill={t.T1} fontSize={7.5} fontWeight={600}>{lbl.length>18?lbl.slice(0,17)+"…":lbl}</text>
                        </g>
                      );
                    })()}
                  </svg>
                  {/* Zoom controls */}
                  <div style={{position:"absolute",bottom:12,right:12,display:"flex",flexDirection:"column",gap:3}}>
                    <button onClick={function(){setGraphZoom(function(z){return Math.min(z+0.3,3);});}} style={{width:22,height:22,borderRadius:5,border:"1px solid "+t.BDR,background:t.isDark?t.CARD:"#fff",color:t.T2,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,lineHeight:1}}>+</button>
                    <button onClick={function(){setGraphZoom(function(z){return Math.max(z-0.3,0.5);});}} style={{width:22,height:22,borderRadius:5,border:"1px solid "+t.BDR,background:t.isDark?t.CARD:"#fff",color:t.T2,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,lineHeight:1}}>−</button>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* generating indicator */}
        {generating && (
          <div style={{flexShrink:0,padding:"6px 12px",background:t.ACC+"0A",borderBottom:"1px solid "+t.ACC+"22",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:10,color:t.ACC,fontWeight:600}}>✦ 생성 중 —</span>
            <span style={{fontSize:10,color:t.T2}}>{{summary:"대화 요약",glossary:"용어 정리",mindmap:"개념 마인드맵","circuit-analysis":"회로 분석","circuit-compare":"회로 비교",experiment:"실험 보고서"}[generating]}</span>
          </div>
        )}

        {/* Card list */}
        {noteView==="list" && <div style={{flex:1,overflowY:"auto",padding:"0 14px 14px",display:"flex",flexDirection:"column",gap:8}}>
          {savedMsgs.length===0 ? (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:10}}>
              <div style={{fontSize:32,opacity:.3}}>✦</div>
              <div style={{color:t.T3,fontSize:11.5,textAlign:"center",lineHeight:1.8}}>위 버튼으로<br/>노트를 만들어보세요</div>
            </div>
          ) : savedMsgs.map(function(msg) {
            var TYPE_META={
              "note":             {label:"직접 메모",    icon:"✏️",clr:t.GRN},
              "ai-msg":           {label:"AI 응답",      icon:"🔖",clr:t.PUR},
              "summary":          {label:"대화 요약",    icon:"📝",clr:t.ACC},
              "glossary":         {label:"용어 정리",    icon:"📖",clr:t.AMB},
              "mindmap":          {label:"개념 마인드맵",icon:"🗺️",clr:t.PUR},
              "circuit-analysis": {label:"회로 분석",    icon:"🔬",clr:t.GRN},
              "circuit-compare":  {label:"회로 비교",    icon:"📊",clr:t.PUR},
              "experiment":       {label:"실험 보고서",  icon:"📋",clr:t.RED},
            };
            var meta=TYPE_META[msg.type]||TYPE_META["ai-msg"];
            var cleanText=msg.content.replace(/\*\*/g,"").replace(/#+\s/g,"").trim();
            var displayTitle=msg.title||meta.label;
            return (
              <div key={msg.id} onClick={function(){setMemoPage(msg);}} style={{background:t.isDark?t.CARD:"transparent",border:"1px solid "+t.BDR,borderRadius:10,padding:"10px 12px",cursor:"pointer",display:"flex",flexDirection:"column",gap:3,transition:"border-color .15s",marginBottom:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:14,flexShrink:0}}>{meta.icon}</span>
                  <span style={{flex:1,color:t.T1,fontSize:12,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{displayTitle}</span>
                  <span style={{background:meta.clr+"12",border:"1px solid "+meta.clr+"33",color:meta.clr,padding:"1px 6px",borderRadius:5,fontSize:9,fontWeight:600,flexShrink:0}}>{meta.label}</span>
                  <span style={{color:t.T3,fontSize:11,flexShrink:0}}>›</span>
                </div>
                <p style={{color:t.T2,fontSize:11,lineHeight:1.6,margin:0,paddingLeft:22,display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{cleanText}</p>
                <div style={{display:"flex",alignItems:"center",gap:6,paddingLeft:22}}>
                  {msg.basis && <>
                    <span style={{color:t.T3,fontSize:9.5,flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",display:"flex",alignItems:"center",gap:3}}><span>🔗</span>{msg.basis}</span>
                  </>}
                  {!msg.basis && <span style={{color:t.T3,fontSize:9.5,flex:1,opacity:.5}}>🔗 없음</span>}
                  {msg.time && <span style={{color:t.T3,fontSize:9.5,flexShrink:0}}>{msg.date?msg.date+" ":""}{msg.time}</span>}
                </div>
              </div>
            );
          })}
        </div>}
        </div>
      )}
      </div>
      )}
    </div>

    </div>{/* end splittable area */}
    </div>
  );
}

/* ── QUIZ MODAL ─────────────────────────── */
function QuizModal(props) {
  var t = useT();
  var tut = props.tut; var lesson = props.lesson; var idx = props.idx;
  var onClose = props.onClose; var onScore = props.onScore;
  var [qs, setQs] = useState(null);
  var [revealed, setRevealed] = useState({});
  var [evals, setEvals] = useState({});
  var [done, setDone] = useState(false);
  var [loading, setLoading] = useState(true);
  var [err, setErr] = useState(null);
  var [fetchKey, setFetchKey] = useState(0);

  useEffect(function() {
    setLoading(true); setErr(null); setQs(null); setRevealed({}); setEvals({}); setDone(false);
    var sys = "양자 컴퓨팅 퀴즈 출제자입니다. 반드시 JSON 배열만 출력하세요.";
    var prompt = '"'+tut.title+'" 커리큘럼의 "'+lesson.title+'" 레슨 퀴즈 1문제를 만들어주세요. 형식: [{"q":"질문","answers":["핵심답변 하나"]}] answers는 단어·구문·짧은 문장 하나, 반드시 1개만.';
    callClaude([{role:"user",content:prompt}], sys)
      .then(function(rep) {
        var m = rep.match(/\[[\s\S]*\]/);
        if (m) { try { setQs(JSON.parse(m[0])); } catch(e) { setErr("퀴즈 파싱 오류"); } }
        else { setErr("퀴즈 형식 오류 — 다시 시도해주세요"); }
        setLoading(false);
      })
      .catch(function() { setErr("오류가 발생했습니다"); setLoading(false); });
  }, [fetchKey]);

  var allEvaled = qs && Object.keys(evals).length === qs.length;
  var score = done ? Object.values(evals).filter(Boolean).length : null;
  var sclr = score===null?t.T3:score===qs.length?t.GRN:score>=qs.length*0.67?t.AMB:t.RED;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}} onClick={function(e){if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:t.CARD,border:"1px solid "+t.BDR,borderRadius:16,padding:28,width:520,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,.5)"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:18}}>
          <div>
            <div style={{color:t.T3,fontSize:10,marginBottom:3}}>{tut.title} · 레슨 {idx+1}</div>
            <div style={{color:t.T1,fontWeight:700,fontSize:15}}>📝 {lesson.title}</div>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:t.T3,fontSize:18,cursor:"pointer",marginLeft:12}}>✕</button>
        </div>

        {loading && (
          <div style={{textAlign:"center",padding:"48px 0"}}>
            <div style={{color:t.T2,fontSize:13,marginBottom:12}}>퀴즈 생성 중...</div>
            <div style={{display:"flex",justifyContent:"center",gap:6}}>
              {[0,1,2].map(function(i){return <div key={i} style={{width:8,height:8,borderRadius:"50%",background:t.ACC,animation:"qBlink 1.2s "+i*.2+"s infinite"}}/>;  })}
            </div>
          </div>
        )}
        {err && (
          <div style={{textAlign:"center",padding:"32px 0"}}>
            <div style={{color:t.RED,fontSize:13,marginBottom:16}}>{err}</div>
            <button onClick={function(){setFetchKey(function(k){return k+1;});}} style={{background:t.ACC,color:"#fff",border:"none",padding:"8px 20px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>다시 시도</button>
          </div>
        )}
        {qs && !loading && (
          <>
            {done && score!==null && (
              <div style={{background:sclr+"15",border:"1px solid "+sclr+"44",borderRadius:12,padding:"14px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:14}}>
                <div style={{fontSize:32,fontWeight:800,color:sclr,lineHeight:1}}>{score}/{qs.length}</div>
                <div>
                  <div style={{color:sclr,fontWeight:700,fontSize:13}}>{score===qs.length?"완벽해요! 🎉":score>=qs.length*0.67?"잘했어요! 👍":"다시 도전해보세요 💪"}</div>
                  <div style={{color:t.T3,fontSize:11,marginTop:2}}>알았어요 {score}개 / {qs.length}문제</div>
                </div>
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {qs.map(function(q,qi) {
                var isRev = !!revealed[qi];
                var ev = evals[qi];
                var bclr = done ? (ev?t.GRN:t.RED) : isRev ? t.BDRH : t.BDR;
                return (
                  <div key={qi} style={{background:t.isDark?t.BG:t.CARDH,border:"1px solid "+bclr,borderRadius:10,padding:"14px",transition:"border-color .2s"}}>
                    <div style={{color:t.T1,fontWeight:600,fontSize:12.5,marginBottom:10,display:"flex",gap:6,alignItems:"flex-start"}}>
                      <span style={{color:t.ACC,fontWeight:800,fontSize:11,flexShrink:0,marginTop:1}}>Q{qi+1}</span>
                      <span>{q.q}</span>
                    </div>
                    {!isRev ? (
                      <button onClick={function(){setRevealed(function(p){return Object.assign({},p,{[qi]:true});});}} style={{width:"100%",padding:"7px",background:"transparent",border:"1px dashed "+t.BDRH,borderRadius:7,color:t.T3,fontSize:11.5,cursor:"pointer",transition:"all .15s"}}>
                        답 보기
                      </button>
                    ) : (
                      <>
                        <div style={{display:"flex",gap:5,alignItems:"flex-start",marginBottom:10}}>
                          <span style={{color:t.GRN,fontSize:10,fontWeight:800,flexShrink:0,marginTop:3}}>A</span>
                          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                            {(q.answers||[]).map(function(ans,ai){
                              return <span key={ai} style={{background:t.GRN+"12",border:"1px solid "+t.GRN+"33",color:t.isDark?t.GRN:"#007755",padding:"3px 10px",borderRadius:6,fontSize:11.5,fontWeight:500}}>{ans}</span>;
                            })}
                          </div>
                        </div>
                        {ev===undefined && !done && (
                          <div style={{display:"flex",gap:7}}>
                            <button onClick={function(){setEvals(function(p){return Object.assign({},p,{[qi]:false});});}} style={{flex:1,padding:"6px",borderRadius:7,border:"1px solid "+t.RED+"55",background:t.RED+"10",color:t.RED,fontSize:12,fontWeight:600,cursor:"pointer"}}>✗ 몰랐어요</button>
                            <button onClick={function(){setEvals(function(p){return Object.assign({},p,{[qi]:true});});}} style={{flex:1,padding:"6px",borderRadius:7,border:"1px solid "+t.GRN+"55",background:t.GRN+"10",color:t.isDark?t.GRN:"#007755",fontSize:12,fontWeight:600,cursor:"pointer"}}>✓ 알았어요</button>
                          </div>
                        )}
                        {ev!==undefined && (
                          <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",borderRadius:7,background:ev?t.GRN+"10":t.RED+"10",border:"1px solid "+(ev?t.GRN:t.RED)+"33"}}>
                            <span style={{color:ev?t.GRN:t.RED,fontWeight:700,fontSize:12}}>{ev?"✓ 알았어요":"✗ 몰랐어요"}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            {!done && (
              <button onClick={function(){
                setDone(true);
                var s=Object.values(evals).filter(Boolean).length;
                var wrongQA=qs.filter(function(_,qi){return evals[qi]===false;});
                if(onScore)onScore(s,qs.length,wrongQA);
              }} disabled={!allEvaled} style={{marginTop:16,width:"100%",padding:"11px",background:allEvaled?"linear-gradient(135deg,"+t.ACC+","+t.PUR+")":"transparent",color:allEvaled?"#fff":t.T3,border:allEvaled?"none":"1px solid "+t.BDR,borderRadius:9,fontSize:13,fontWeight:700,cursor:allEvaled?"pointer":"default",transition:"all .2s"}}>
                {allEvaled?"결과 보기 →":"모든 문제를 확인해주세요"}
              </button>
            )}
            {done && (
              <div style={{marginTop:16,display:"flex",gap:8}}>
                <button onClick={onClose} style={{flex:1,padding:"10px",background:"transparent",border:"1px solid "+t.BDR,color:t.T2,borderRadius:9,fontSize:13,cursor:"pointer",fontWeight:600}}>닫기</button>
                <button onClick={function(){setFetchKey(function(k){return k+1;});}} style={{flex:1,padding:"10px",background:"linear-gradient(135deg,"+t.ACC+","+t.PUR+")",color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer"}}>🔄 다시 풀기</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── SUBMIT MODAL ───────────────────────── */
function SubmitModal(props) {
  var t = useT();
  var circuit = props.circuit;
  var gates = GATE_DEFS(t);
  var gById = function(id){return gates.find(function(g){return g.id===id;});};
  var [taskName, setTaskName] = useState("Bell 상태 구현");
  var [notes, setNotes] = useState("");
  var [done, setDone] = useState(false);
  var hasCircuit = circuit.some(function(r){return r.some(function(g){return !!g;});});

  if (done) return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}} onClick={props.onClose}>
      <div style={{background:t.CARD,border:"1px solid "+t.GRN+"55",borderRadius:18,padding:36,textAlign:"center",maxWidth:320}} onClick={function(e){e.stopPropagation();}}>
        <div style={{fontSize:44,marginBottom:12}}>✅</div>
        <div style={{color:t.GRN,fontWeight:800,fontSize:18,marginBottom:8}}>제출 완료!</div>
        <div style={{color:t.T2,fontSize:13,lineHeight:1.6,marginBottom:22}}><strong style={{color:t.T1}}>"{taskName}"</strong> 회로가<br/>성공적으로 제출되었습니다.</div>
        <button onClick={props.onClose} style={{background:t.GRN,color:"#000",border:"none",padding:"9px 28px",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer"}}>확인</button>
      </div>
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}} onClick={function(e){if(e.target===e.currentTarget)props.onClose();}}>
      <div style={{background:t.CARD,border:"1px solid "+t.BDR,borderRadius:16,padding:28,width:460,maxHeight:"80vh",overflowY:"auto",boxShadow:t.isDark?"0 24px 64px rgba(0,0,0,.7)":"0 24px 64px rgba(0,0,0,.18)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div style={{color:t.T1,fontWeight:700,fontSize:16}}>작업 제출</div>
          <button onClick={props.onClose} style={{background:"transparent",border:"none",color:t.T3,fontSize:18,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{background:t.isDark?t.BG:t.CARDH,border:"1px solid "+t.BDR,borderRadius:10,padding:14,marginBottom:16}}>
          <div style={{color:t.T2,fontSize:10,letterSpacing:".06em",textTransform:"uppercase",marginBottom:9}}>{hasCircuit?"제출할 회로":"회로 없음"}</div>
          {hasCircuit ? (
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {circuit.map(function(row,q) {
                return (
                  <div key={q} style={{display:"flex",alignItems:"center",gap:2}}>
                    <span style={{color:t.ACC,fontSize:10,width:26,textAlign:"right",paddingRight:4}}>q[{q}]</span>
                    {row.map(function(cell,s){
                      var g=cell?gById(cell):null;
                      return <div key={s} style={{width:22,height:18,borderRadius:3,background:g?g.clr+"20":"transparent",border:"1px solid "+(g?g.clr:t.T3+"33"),display:"flex",alignItems:"center",justifyContent:"center",color:g?g.clr:t.T3,fontSize:8.5,fontWeight:g?800:400}}>{g?g.lbl:"─"}</div>;
                    })}
                  </div>
                );
              })}
            </div>
          ) : <div style={{color:t.T3,fontSize:12}}>에디터에 회로를 작성해주세요.</div>}
        </div>
        <div style={{marginBottom:13}}>
          <div style={{color:t.T2,fontSize:11,marginBottom:5}}>과제명</div>
          <input value={taskName} onChange={function(e){setTaskName(e.target.value);}} style={{width:"100%",background:t.isDark?t.BG:t.CARDH,border:"1px solid "+t.BDRH,borderRadius:8,color:t.T1,padding:"9px 12px",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div style={{marginBottom:22}}>
          <div style={{color:t.T2,fontSize:11,marginBottom:5}}>메모 (선택)</div>
          <textarea value={notes} onChange={function(e){setNotes(e.target.value);}} rows={3} placeholder="회로 구현 과정이나 특이사항..." style={{width:"100%",background:t.isDark?t.BG:t.CARDH,border:"1px solid "+t.BDRH,borderRadius:8,color:t.T1,padding:"9px 12px",fontSize:13,outline:"none",resize:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={props.onClose} style={{flex:1,background:"transparent",border:"1px solid "+t.BDR,color:t.T2,padding:"10px",borderRadius:9,fontSize:13,cursor:"pointer"}}>취소</button>
          <button onClick={function(){setDone(true);}} style={{flex:2,background:"linear-gradient(135deg,"+t.ACC+","+t.PUR+")",color:"#fff",border:"none",padding:"10px",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer"}}>⚡ 제출하기</button>
        </div>
      </div>
    </div>
  );
}

/* ── MAIN APP ───────────────────────────── */
export default function App() {
  var [isDark, setIsDark] = useState(false);
  var [circuit, setCircuit] = useState(mkCkt());
  var [circuitSource, setCircuitSource] = useState(null);

  var [savedCircuits, setSavedCircuits] = useState(function() {
    var bellCkt = mkCkt(); bellCkt[0][0]="H"; bellCkt[1][1]="CX"; bellCkt[0][3]="M"; bellCkt[1][3]="M";
    var ghzCkt  = mkCkt(); ghzCkt[0][0]="H"; ghzCkt[0][1]="CX"; ghzCkt[1][2]="CX"; ghzCkt[0][4]="M"; ghzCkt[1][4]="M"; ghzCkt[2][4]="M";
    var grCkt   = mkCkt(); grCkt[0][0]="H"; grCkt[1][0]="H"; grCkt[2][0]="H"; grCkt[0][2]="Z"; grCkt[0][3]="H"; grCkt[1][3]="H"; grCkt[2][3]="H";
    return [
      { id:301, title:"Bell 상태 실습", circuit:bellCkt, savedAt:"09:42", savedDate:"2026.08.20", source:{type:"ai"} },
      { id:302, title:"GHZ 3큐비트",   circuit:ghzCkt,  savedAt:"10:15", savedDate:"2026.08.20", source:{type:"manual"} },
      { id:303, title:"Grover 디퓨저", circuit:grCkt,   savedAt:"11:03", savedDate:"2026.08.19", source:{type:"ai"} },
    ];
  });
  function handleAddCircuitSource(name, circ, source) {
    setSavedCircuits(function(p){
      return [{id:Date.now(),title:name,circuit:circ,savedAt:new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"}),source:source||null}].concat(p);
    });
  }
  function handleDeleteCircuit(id) {
    setSavedCircuits(function(p){return p.filter(function(c){return c.id!==id;});});
  }

  var [activeSources, setActiveSources] = useState([]);
  var [sources, setSources] = useState(function() {
    return SOURCES.concat(REF_CIRCUITS.map(function(rc){ return Object.assign({},rc,{circuit:buildCkt(rc.gates)}); }));
  });
  function toggleSource(src) {
    setActiveSources(function(prev) {
      var has = prev.some(function(s){return s.id===src.id;});
      return has ? prev.filter(function(s){return s.id!==src.id;}) : prev.concat([src]);
    });
  }
  var [activeTutorial, setActiveTutorial] = useState(null);
  var [activeLessonIdx, setActiveLessonIdx] = useState(null);
  var [submitOpen, setSubmitOpen] = useState(false);
  var [chatPrompt, setChatPrompt] = useState(null);
  var [savedMsgs, setSavedMsgs] = useState([
    { id:"memo1",  type:"ai-msg",  date:"2026.08.20",           title:"H 게이트와 CNOT으로 만드는 최대 얽힘",     time:"09:30", basis:"⚛ Bell 상태 실습",                                         content:"Bell 상태에서 H 게이트는 q[0]을 |0⟩에서 (|0⟩+|1⟩)/√2 중첩 상태로 만들고, CNOT은 이 중첩을 q[1]로 전파해 최대 얽힘 상태 |Φ+⟩를 형성합니다. 측정하면 반드시 |00⟩ 또는 |11⟩만 나와요." },
    { id:"memo2",  type:"summary",  date:"2026.08.20",           title:"양자 컴퓨팅 입문 학습 핵심 정리",          time:"10:05", basis:"전체 대화",                                                  content:"**양자 컴퓨팅 입문 학습 핵심 정리**\n• 중첩(Superposition)과 얽힘(Entanglement) 개념 학습\n• H·X·CNOT 게이트의 역할과 조합 방식 이해\n• Bell 상태 및 GHZ 상태 회로 구현 실습\n• 측정과 파동함수 붕괴의 확률적 해석 확인\n• 양자 우월성의 핵심인 병렬 연산 원리 파악" },
    { id:"memo3",  type:"circuit-analysis",  date:"2026.08.20", title:"Bell 상태 회로의 얽힘 생성 메커니즘",      time:"11:20", basis:"⚛ Bell 상태 실습",                                         content:"**Bell 상태 회로의 얽힘 생성 메커니즘**\nH 게이트로 q[0]을 중첩 후 CNOT으로 q[1]과 얽음. 최종 상태 |Φ+⟩=(|00⟩+|11⟩)/√2. 측정 시 50:50으로 |00⟩ 또는 |11⟩만 관측됨. 위상 킥백 없이 최소 게이트로 최대 얽힘 달성." },
    { id:"memo4",  type:"circuit-analysis",  date:"2026.08.20", title:"Grover 오라클 및 디퓨저 회로 분석",        time:"13:10", basis:"⚛ Grover 탐색 알고리즘",                                    content:"**Grover 오라클 및 디퓨저 회로 분석**\n오라클: 목표 상태의 위상을 π 뒤집어 표식. 디퓨저: 평균에 대한 반전(Inversion about mean)으로 목표 진폭 증폭. 반복 횟수 k ≈ π/4·√N 이상이면 확률 감소. 3큐비트 예시에서 정확히 2회 반복이 최적." },
    { id:"memo5",  type:"circuit-compare",  date:"2026.08.20",   title:"Bell vs Grover 회로 구조 비교",            time:"13:45", basis:"⚛ Bell 상태 실습 · ⚛ Grover 탐색 알고리즘",               content:"**Bell vs Grover 회로 구조 비교**\n| 항목 | Bell | Grover |\n|------|------|--------|\n| 목적 | 얽힘 생성 | 탐색 가속 |\n| 게이트 수 | 2 | O(√N) 반복 |\n| 출력 | 최대 얽힘 | 목표 상태 진폭 증폭 |\nBell은 단순 얽힘, Grover는 반복 증폭 구조." },
    { id:"memo6",  type:"mindmap",  date:"2026.08.20",           title:"양자 컴퓨팅 핵심 개념 마인드맵",           time:"14:00", basis:"전체 대화",                                                  content:"## 양자 컴퓨팅 핵심 개념\n양자 상태\n  중첩 (Superposition)\n    H 게이트 적용\n    |0⟩+|1⟩ → 측정 시 확률적 붕괴\n  얽힘 (Entanglement)\n    Bell 상태\n    GHZ 상태\n양자 게이트\n  단일 큐비트: H, X, Z, Y, S, T\n  2큐비트: CNOT, CZ, SWAP\n양자 알고리즘\n  Grover: O(√N) 탐색\n  Shor: 소인수 분해\n  QFT: 양자 푸리에 변환" },
    { id:"memo7",  type:"glossary",  date:"2026.08.20",          title:"양자 컴퓨팅 핵심 용어 정리",              time:"14:30", basis:"전체 대화",                                                  content:"**큐비트(Qubit)**: 양자 정보의 기본 단위. |0⟩과 |1⟩의 중첩 가능\n**중첩(Superposition)**: 측정 전 |0⟩과 |1⟩ 동시 존재 상태\n**얽힘(Entanglement)**: 두 큐비트가 비국소적으로 상관된 상태\n**게이트(Gate)**: 큐비트에 작용하는 유니터리 연산\n**측정(Measurement)**: 양자 상태를 고전 비트로 붕괴\n**파동함수 붕괴**: 측정 시 중첩이 확률적으로 결정됨\n**위상 킥백(Phase Kickback)**: 제어 큐비트에 위상이 반사되는 현상" },
    { id:"memo8",  type:"circuit-analysis",  date:"2026.08.20", title:"QFT 3큐비트 위상 회전 분석",              time:"15:00", basis:"⚛ QFT 3큐비트",                                            content:"**QFT 3큐비트 위상 회전 분석**\nH 게이트로 각 큐비트를 중첩 후 제어 위상 회전 R_k 적용. k번째 큐비트에 2π/2^k 위상 부여. SWAP으로 비트 역순 정렬. 총 게이트 수: O(n²). 3큐비트 기준 H×3 + R2×2 + R3×1 + SWAP×1 구성." },
    { id:"memo9",  type:"experiment",  date:"2026.08.20",        title:"QFT 구현 및 역변환 실험 보고서",           time:"15:30", basis:"⚛ QFT 3큐비트 · ⚛ Grover 탐색 알고리즘",                 content:"**QFT 구현 및 역변환 실험 보고서**\n\n목적: QFT와 역QFT의 정확성 검증\n방법: |5⟩ 입력 → QFT → 역QFT → 측정\n결과: 99.8% 확률로 |5⟩ 복원 성공\n고찰: 게이트 오차 누적이 정밀도에 영향. Grover와 QFT 결합 시 위상 추정 알고리즘 구현 가능성 확인." },
    { id:"memo10", type:"circuit-compare",  date:"2026.08.20",   title:"Grover vs QFT 알고리즘 회로 구조 비교",   time:"16:00", basis:"⚛ Grover 탐색 알고리즘 · ⚛ QFT 3큐비트",                 content:"**Grover vs QFT 알고리즘 회로 구조 비교**\n| 항목 | Grover | QFT |\n|------|--------|-----|\n| 구조 | 반복 블록 | 계층적 위상 회전 |\n| 깊이 | O(√N) | O(n²) |\n| 활용 | 비정렬 탐색 | 주파수 분석·위상 추정 |\nGrover는 진폭 증폭, QFT는 위상 정보 추출에 특화." },
    { id:"memo11", type:"note",  date:"2026.08.20",              title:"학습 중 떠오른 아이디어 메모",             time:"16:30", basis:"⚛ Grover 탐색 알고리즘",                                                         content:"양자 컴퓨팅과 금융 최적화 연결 가능성 — 포트폴리오 최적화 문제에 QAOA 적용 가능? Grover를 활용한 데이터베이스 탐색이 실제 금융 데이터에 어떻게 작동할지 다음 세션에서 탐구해보자." },
  ]);
  var [quizResults, setQuizResults] = useState({
    "bell_0": {
      attempted:true, score:0, total:1, ts:Date.now()-9000,
      wrongQA:[{q:"큐비트가 중첩 상태일 때, 측정 전 상태는?", answers:["중첩(superposition)"]}],
    },
    "bell_1": {
      attempted:true, score:1, total:1, ts:Date.now()-6000,
      wrongQA:[],
    },
    "bell_2": {
      attempted:true, score:0, total:1, ts:Date.now()-4000,
      wrongQA:[{q:"Hadamard 게이트를 |0⟩에 적용하면 결과는?", answers:["(|0⟩+|1⟩)/√2"]}],
    },
    "bell_3": {
      attempted:true, score:0, total:1, ts:Date.now()-2000,
      wrongQA:[{q:"양자 측정 후 중첩 상태는 어떻게 변하나요?", answers:["파동함수 붕괴(collapse)"]}],
    },
  });
  var [practiceResults, setPracticeResults] = useState({
    "bell_p1": {score: 95},
    "bell_p2": {score: 32},
  });
  var [simTrigger, setSimTrigger] = useState(0);
  function triggerSim() { setSimTrigger(function(n){return n+1;}); }
  var [leftW, setLeftW] = useState(300);
  var [rightW, setRightW] = useState(400);
  var [chatMsgs, setChatMsgs] = useState(INIT_MSGS);
  var [chatMode, setChatMode] = useState("normal");
  var [chatModeType, setChatModeType] = useState("doc");
  var theme = isDark ? DARK : LIGHT;
  var t = theme;

  function handleQuizScore(tutId, lessonIdx, score, total, wrongQA) {
    var key = tutId + "_" + lessonIdx;
    setQuizResults(function(p) {
      return Object.assign({}, p, {[key]: {attempted:true, score:score, total:total, ts:Date.now(), wrongQA:wrongQA||[]}});
    });
  }

  function handlePracticeResult(probId, score) {
    setPracticeResults(function(p) {
      return Object.assign({}, p, {[probId]: {score:score}});
    });
  }

  function dragLeft(e) {
    e.preventDefault();
    var sx = e.clientX;
    function mv(ev) { setLeftW(function(v){return Math.max(180,Math.min(420,v+ev.clientX-sx));}); sx=ev.clientX; }
    function up() { document.removeEventListener('mousemove',mv); document.removeEventListener('mouseup',up); }
    document.addEventListener('mousemove',mv);
    document.addEventListener('mouseup',up);
  }
  function dragRight(e) {
    e.preventDefault();
    var sx = e.clientX;
    function mv(ev) { setRightW(function(v){return Math.max(280,Math.min(560,v-(ev.clientX-sx)))}); sx=ev.clientX; }
    function up() { document.removeEventListener('mousemove',mv); document.removeEventListener('mouseup',up); }
    document.addEventListener('mousemove',mv);
    document.addEventListener('mouseup',up);
  }
  function handleAddNote(text, refs) {
    if (!text.trim()) return;
    var now = new Date();
    var hhmm = now.getHours().toString().padStart(2,"0")+":"+now.getMinutes().toString().padStart(2,"0");
    var dateStr = now.getFullYear()+"."+(now.getMonth()+1).toString().padStart(2,"0")+"."+now.getDate().toString().padStart(2,"0");
    var basis = (refs&&refs.length>0) ? refs.join(" · ") : null;
    setSavedMsgs(function(p) {
      return [{id:"note_"+Date.now(), type:"note", content:text, time:hhmm, date:dateStr, basis:basis}].concat(p);
    });
  }
  function handleSaveMsg(msg) {
    setSavedMsgs(function(p) {
      if (p.find(function(x){return x.id===msg.id;})) return p;
      return [{id:msg.id, type:"ai-msg", content:msg.content, circuit:msg.circuit}].concat(p);
    });
  }
  function handleSaveOutput(output) {
    setSavedMsgs(function(p) { return [output].concat(p); });
  }
  function handleUnsaveMsg(id) {
    setSavedMsgs(function(p){return p.filter(function(x){return x.id!==id;});});
  }
  function handleShareNote(id) {
    setSavedMsgs(function(p){return p.map(function(x){return x.id===id?Object.assign({},x,{shared:!x.shared}):x;});});
  }
  function handleStartLesson(tut, lesson, idx) {
    setActiveTutorial(tut);
    setActiveLessonIdx(idx);
    setCircuit(lesson.gates && lesson.gates.length ? buildCkt(lesson.gates) : mkCkt());
    if (lesson.gates && lesson.gates.length) triggerSim();
    if (lesson.prompt) {
      setTimeout(function() { setChatPrompt({text:lesson.prompt,ts:Date.now()}); }, 100);
    }
  }

  function handleQuiz() {
    if (!activeTutorial || activeLessonIdx === null) return;
    var lessons = TUTORIAL_LESSONS[activeTutorial.id] || [];
    var lesson = lessons[activeLessonIdx];
    if (!lesson) return;
    var prompt = '"' + activeTutorial.title + '" 커리큘럼의 "' + lesson.title + '" 레슨에 대한 퀴즈를 출제해줘. 4지선다 3문제로 만들고, 각 문제마다 보기 4개, 정답, 그리고 한 줄 해설을 포함해줘. 마지막에 총점도 알려줘.';
    var qKey = activeTutorial.id + "_" + activeLessonIdx;
    setQuizResults(function(p) { var ex=p[qKey]||{}; return Object.assign({},p,{[qKey]:Object.assign({},ex,{attempted:true})}); });
    setChatPrompt({text: prompt, ts: Date.now(), quizCtx: {tutId: activeTutorial.id, lessonIdx: activeLessonIdx}});
  }

  function handleStartQuiz(tut, lesson, idx) {
    setActiveTutorial(tut);
    setActiveLessonIdx(idx);
    setCircuit(lesson.gates && lesson.gates.length ? buildCkt(lesson.gates) : mkCkt());
    if (lesson.gates && lesson.gates.length) triggerSim();
    var prompt = '"' + tut.title + '" 커리큘럼의 "' + lesson.title + '" 레슨에 대한 퀴즈를 출제해줘. 4지선다 3문제로 만들고, 각 문제마다 보기 4개, 정답, 그리고 한 줄 해설을 포함해줘. 마지막에 총점도 알려줘.';
    var qKey = tut.id + "_" + idx;
    setQuizResults(function(p) { var ex=p[qKey]||{}; return Object.assign({},p,{[qKey]:Object.assign({},ex,{attempted:true})}); });
    setTimeout(function() {
      setChatPrompt({text: prompt, ts: Date.now(), quizCtx: {tutId: tut.id, lessonIdx: idx}});
    }, 50);
  }

  function handleNextLesson() {    if (!activeTutorial || activeLessonIdx===null) return;
    var lessons = TUTORIAL_LESSONS[activeTutorial.id] || [];
    var nextIdx = activeLessonIdx+1;
    if (nextIdx < lessons.length) handleStartLesson(activeTutorial, lessons[nextIdx], nextIdx);
  }

  function handlePrevLesson() {
    if (!activeTutorial || activeLessonIdx===null) return;
    var lessons = TUTORIAL_LESSONS[activeTutorial.id] || [];
    var prevIdx = activeLessonIdx-1;
    if (prevIdx >= 0) {
      setActiveLessonIdx(prevIdx);
      setCircuit(lessons[prevIdx].gates && lessons[prevIdx].gates.length ? buildCkt(lessons[prevIdx].gates) : mkCkt());
    }
  }

  return (
    <ThemeCtx.Provider value={theme}>
      <div style={{display:"flex",flexDirection:"column",height:"100vh",background:t.BG,fontFamily:"'Pretendard','Inter','Helvetica Neue',system-ui,sans-serif",color:t.T1,overflow:"hidden",transition:"background .25s,color .25s"}}>
        <style>{"@import url('https://cdn.jsdelivr.net/npm/pretendard@latest/dist/web/static/pretendard.css');\n          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}\n          ::-webkit-scrollbar{width:4px;height:4px;}\n          ::-webkit-scrollbar-track{background:transparent;}\n          ::-webkit-scrollbar-thumb{background:"+t.scrollThumb+";border-radius:2px;}\n          input,textarea,button{font-family:'Pretendard',inherit;}\n          @keyframes qBlink{0%,100%{opacity:.25}50%{opacity:1}}\n        "}</style>
        <div style={{height:40,flexShrink:0,background:t.SURF,borderBottom:"1px solid "+t.BDR,display:"flex",alignItems:"center",padding:"0 16px",gap:12,transition:"background .25s"}}>
          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:9,flexShrink:0}}>
            <svg width="24" height="24" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="15" cy="15" rx="13" ry="5" stroke={t.ACC} strokeWidth="2.2" fill="none" opacity=".9"/>
              <ellipse cx="15" cy="15" rx="13" ry="5" stroke={t.PUR} strokeWidth="2.2" fill="none" opacity=".65" transform="rotate(60 15 15)"/>
              <ellipse cx="15" cy="15" rx="13" ry="5" stroke={t.ACC} strokeWidth="2.2" fill="none" opacity=".45" transform="rotate(120 15 15)"/>
              <circle cx="15" cy="15" r="2.2" fill={t.ACC}/>
            </svg>
            <div style={{fontSize:14,fontWeight:800,letterSpacing:"-.03em",color:t.T1}}>QX Platform</div>
          </div>

          <div style={{flex:1}}/>

          {/* Right controls */}
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            <button onClick={function(){setIsDark(function(d){return !d;});}} style={{width:24,height:24,borderRadius:6,cursor:"pointer",background:t.isDark?t.CARD:t.CARDH,border:"1px solid "+t.BDR,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>
              {isDark?"☀️":"🌙"}
            </button>
            <div style={{width:1,height:16,background:t.BDR}}/>
            <div style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer"}}>
              <div style={{width:22,height:22,borderRadius:6,background:t.isDark?t.CARD:t.CARDH,border:"1px solid "+t.BDR,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="9" r="4" fill={t.T3}/>
                  <ellipse cx="11" cy="19" rx="7.5" ry="5" fill={t.T3}/>
                </svg>
              </div>
              <span style={{color:t.T1,fontSize:11.5,fontWeight:600}}>홍길동</span>
            </div>
          </div>
        </div>
        <div style={{flex:1,display:"flex",overflow:"hidden"}}>
          <LeftPanel panelWidth={leftW} sources={sources} setSources={setSources} circuit={circuit} setCircuit={setCircuit} activeSources={activeSources} toggleSource={toggleSource} activeTutorial={activeTutorial} activeLessonIdx={activeLessonIdx} onStartLesson={handleStartLesson} onSendToChat={function(txt){setChatPrompt({text:txt,ts:Date.now()});}} quizResults={quizResults} onStartQuiz={handleStartQuiz} practiceResults={practiceResults} onPracticeResult={handlePracticeResult} onStartSourceSearch={function(type){setChatModeType(type);setChatMode("search");setChatPrompt({text:"__SOURCE_SEARCH__:"+type,ts:Date.now()});}} sharedNotes={savedMsgs.filter(function(m){return m.shared;})} onShareNote={handleShareNote}/>
          {/* Left↔Center drag handle */}
          <div onMouseDown={dragLeft} style={{width:6,flexShrink:0,cursor:"col-resize",display:"flex",alignItems:"center",justifyContent:"center",background:"transparent",position:"relative",zIndex:5,userSelect:"none"}}>
            <div style={{width:2,height:"100%",background:t.BDR}}/>
          </div>
          <ChatCenter circuit={circuit} setCircuit={setCircuit} activeSources={activeSources} activeTutorial={activeTutorial} activeLessonIdx={activeLessonIdx} onNextLesson={handleNextLesson} onPrevLesson={handlePrevLesson} onQuiz={handleQuiz} chatPrompt={chatPrompt} onSaveMsg={handleSaveMsg} onUnsaveMsg={handleUnsaveMsg} savedIds={savedMsgs.map(function(m){return m.id;})} onAddCircuit={function(rows,note){handleAddCircuitSource(note||("채팅 회로 "+(savedCircuits.length+1)),rows,{type:"ai"});}} onQuizScore={handleQuizScore} chatMode={chatMode} onExitSearchMode={function(){setChatMode("normal");}} onAddSource={function(src){setSources(function(p){var exists=p.find(function(x){return x.id===src.id;});return exists?p:p.concat([src]);});}} msgs={chatMsgs} setMsgs={setChatMsgs} onSetCircuitSource={setCircuitSource}/>
          {/* Center↔Right drag handle */}
          <div onMouseDown={dragRight} style={{width:6,flexShrink:0,cursor:"col-resize",display:"flex",alignItems:"center",justifyContent:"center",background:"transparent",position:"relative",zIndex:5,userSelect:"none"}}>
            <div style={{width:2,height:"100%",background:t.BDR}}/>
          </div>
          <RightCircuit panelWidth={rightW} circuit={circuit} setCircuit={setCircuit} onSubmit={function(){setSubmitOpen(true);}} savedMsgs={savedMsgs} onUnsave={handleUnsaveMsg} onAddNote={handleAddNote} onSaveCircuit={handleAddCircuitSource} circuits={savedCircuits} onDeleteCircuit={handleDeleteCircuit} chatMsgs={chatMsgs} onSaveOutput={handleSaveOutput} simTrigger={simTrigger} onSimTrigger={triggerSim} circuitSource={circuitSource} onSetCircuitSource={setCircuitSource} onAskChat={function(txt){setChatPrompt({text:txt,ts:Date.now()});}} onShareNote={handleShareNote}/>
        </div>
        {submitOpen && <SubmitModal circuit={circuit} onClose={function(){setSubmitOpen(false);}}/>}
      </div>
    </ThemeCtx.Provider>
  );
}
