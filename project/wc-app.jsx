// wc-app.jsx — Root App + State Management

const {MATCHES: BASE_MATCHES, calculatePoints} = window.WC_DATA;

// ── Default state with demo users + pre-placed bets ─────────────────────────
function defaultState() {
  const users = [
    {id:'u001', username:'AndrésMesa',  email:'andres@demo.com', password:'demo123', playerId:'messi',      poolJoined:true,  createdAt:'2026-06-01'},
    {id:'u002', username:'CarlosRoa',   email:'carlos@demo.com', password:'demo123', playerId:'mbappe',     poolJoined:true,  createdAt:'2026-06-01'},
    {id:'u003', username:'LauraVega',   email:'laura@demo.com',  password:'demo123', playerId:'pedri',      poolJoined:true,  createdAt:'2026-06-01'},
    {id:'u004', username:'DiegoSilva',  email:'diego@demo.com',  password:'demo123', playerId:'vini',       poolJoined:true,  createdAt:'2026-06-02'},
    {id:'u005', username:'SofíaP',      email:'sofia@demo.com',  password:'demo123', playerId:'haaland',    poolJoined:true,  createdAt:'2026-06-03'},
    {id:'demo', username:'Demo',         email:'demo@polla.com',  password:'demo123', playerId:'bellingham', poolJoined:true,  createdAt:'2026-06-09'},
  ];

  const bets = {
    u001: {
      m001:{home:2,away:1}, m002:{home:0,away:0}, m003:{home:0,away:2}, m004:{home:2,away:0},
      m005:{home:3,away:0}, m006:{home:2,away:0}, m007:{home:1,away:0}, m008:{home:2,away:1},
      m009:{home:2,away:0}, m010:{home:0,away:1}, m011:{home:3,away:0}, m012:{home:1,away:1},
      m013:{home:2,away:0}, m014:{home:0,away:0},
    },
    u002: {
      m001:{home:1,away:0}, m002:{home:2,away:0}, m003:{home:1,away:1}, m004:{home:1,away:0},
      m005:{home:2,away:0}, m006:{home:1,away:0}, m007:{home:2,away:1}, m008:{home:1,away:1},
      m009:{home:1,away:0}, m010:{home:0,away:1}, m011:{home:2,away:0}, m012:{home:2,away:2},
      m013:{home:3,away:1},
    },
    u003: {
      m001:{home:1,away:1}, m002:{home:1,away:0}, m003:{home:0,away:3}, m004:{home:3,away:0},
      m005:{home:4,away:1}, m006:{home:1,away:0}, m007:{home:2,away:0}, m008:{home:2,away:0},
      m009:{home:1,away:0}, m011:{home:2,away:0}, m013:{home:2,away:1},
    },
    u004: {
      m001:{home:2,away:0}, m002:{home:0,away:1}, m003:{home:1,away:2}, m004:{home:2,away:0},
      m005:{home:3,away:2}, m006:{home:2,away:0}, m007:{home:0,away:0}, m008:{home:1,away:1},
      m011:{home:3,away:0}, m012:{home:1,away:1},
    },
    u005: {
      m001:{home:3,away:1}, m002:{home:1,away:1}, m003:{home:0,away:1}, m004:{home:2,away:1},
      m005:{home:5,away:0}, m007:{home:1,away:0}, m009:{home:2,away:0}, m011:{home:2,away:0},
      m012:{home:2,away:2}, m013:{home:3,away:1}, m014:{home:1,away:1},
    },
    demo: {
      m001:{home:2,away:0}, m002:{home:1,away:1}, m003:{home:0,away:1}, m004:{home:3,away:0},
      m005:{home:4,away:1},
    },
  };

  return { users, currentUser:null, bets, matchResults:{}, view:'auth', showAdmin:false };
}

function loadState() {
  try { const s=localStorage.getItem('pollaWC2026_v3'); if(s) return JSON.parse(s); } catch(e){}
  return defaultState();
}

// ── Root App ─────────────────────────────────────────────────────────────────
function App() {
  const [state, setState]   = React.useState(loadState);
  const [showIntro, setShowIntro] = React.useState(
    () => localStorage.getItem('pollaWC2026_intro') !== 'done'
  );

  // Persist on change
  React.useEffect(() => {
    localStorage.setItem('pollaWC2026_v3', JSON.stringify(state));
  }, [state]);

  // Merge admin result overrides into match list
  const matches = React.useMemo(() => BASE_MATCHES.map(m => {
    const r = state.matchResults[m.id];
    return r ? {...m, homeScore:r.home, awayScore:r.away, status:'finished'} : m;
  }), [state.matchResults]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const introComplete = () => {
    setShowIntro(false);
    localStorage.setItem('pollaWC2026_intro','done');
  };

  const login = (email, password) => {
    const u = state.users.find(u => u.email===email && u.password===password);
    if (!u) { alert('Credenciales incorrectas. Prueba el acceso demo.'); return; }
    setState(p => ({...p, currentUser:u, view:'dashboard'}));
  };

  const register = ({username, email, password, joinPool}) => {
    if (state.users.find(u=>u.email===email)) { alert('Este correo ya está registrado.'); return; }
    const nu = {id:'u'+Date.now(), username, email, password, playerId:null, poolJoined:!!joinPool, createdAt:new Date().toISOString()};
    setState(p => ({...p, users:[...p.users, nu], currentUser:nu, view:'playerSelect'}));
  };

  const selectPlayer = (playerId) => {
    setState(p => ({
      ...p,
      currentUser:{...p.currentUser, playerId},
      users: p.users.map(u => u.id===p.currentUser.id ? {...u, playerId} : u),
      view:'dashboard',
    }));
  };

  const placeBet = (matchId, home, away) => {
    const uid = state.currentUser.id;
    setState(p => ({
      ...p,
      bets:{...p.bets, [uid]:{...(p.bets[uid]||{}), [matchId]:{home,away,at:new Date().toISOString()}}},
    }));
  };

  const updateResult = (matchId, home, away) => {
    setState(p => ({...p, matchResults:{...p.matchResults, [matchId]:{home,away}}}));
  };

  const logout = () => setState(p=>({...p, currentUser:null, view:'auth', showAdmin:false}));
  const go     = (view) => setState(p=>({...p, view}));

  // Compute current user's live point total
  const userTotalPoints = React.useMemo(() => {
    if (!state.currentUser) return 0;
    const ub = state.bets[state.currentUser.id] || {};
    return matches.reduce((s, m) => {
      if (m.status !== 'finished') return s;
      const b = ub[m.id]; if (!b) return s;
      return s + calculatePoints(b.home, b.away, m.homeScore, m.awayScore);
    }, 0);
  }, [state.currentUser, state.bets, matches]);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (showIntro) return <window.IntroAnimation onComplete={introComplete} />;

  const {currentUser, users, bets, view, showAdmin} = state;

  if (!currentUser) return <window.AuthScreen onLogin={login} onRegister={register} />;

  if (!currentUser.playerId) return <window.PlayerSelectScreen onSelect={selectPlayer} />;

  if (showAdmin) return (
    <window.AdminScreen
      matches={matches}
      onClose={() => setState(p=>({...p, showAdmin:false}))}
      onUpdateResult={updateResult}
    />
  );

  return (
    <div style={{background:'#050508', minHeight:'100vh'}}>
      <window.NavBar user={currentUser} view={view} onNavigate={go} onLogout={logout} userPoints={userTotalPoints} />

      {view==='dashboard' && (
        <window.DashboardScreen user={currentUser} users={users} bets={bets} matches={matches} onNavigate={go} />
      )}
      {view==='matches' && (
        <window.MatchesScreen user={currentUser} bets={bets} matches={matches} onBet={placeBet} />
      )}
      {view==='leaderboard' && (
        <window.LeaderboardScreen users={users} bets={bets} matches={matches} currentUser={currentUser} />
      )}
      {view==='profile' && (
        <window.ProfileScreen
          user={currentUser} users={users} bets={bets} matches={matches}
          onChangePlayer={selectPlayer} onLogout={logout}
          onShowAdmin={() => setState(p=>({...p, showAdmin:true}))}
        />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
