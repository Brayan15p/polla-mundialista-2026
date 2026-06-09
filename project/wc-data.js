// wc-data.js — FIFA World Cup 2026 Data Module v2
window.WC_DATA = (function () {

  const FLAGS = {
    'Mexico':'🇲🇽','South Africa':'🇿🇦','Korea Republic':'🇰🇷','Czechia':'🇨🇿',
    'Canada':'🇨🇦','Bosnia and Herzegovina':'🇧🇦','Qatar':'🇶🇦','Switzerland':'🇨🇭',
    'Brazil':'🇧🇷','Morocco':'🇲🇦','Haiti':'🇭🇹','Scotland':'🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'USA':'🇺🇸','Paraguay':'🇵🇾','Australia':'🇦🇺','Türkiye':'🇹🇷',
    'Germany':'🇩🇪','Curaçao':'🇨🇼',"Côte d'Ivoire":'🇨🇮','Ecuador':'🇪🇨',
    'Netherlands':'🇳🇱','Japan':'🇯🇵','Sweden':'🇸🇪','Tunisia':'🇹🇳',
    'Belgium':'🇧🇪','Egypt':'🇪🇬','IR Iran':'🇮🇷','New Zealand':'🇳🇿',
    'Spain':'🇪🇸','Cabo Verde':'🇨🇻','Saudi Arabia':'🇸🇦','Uruguay':'🇺🇾',
    'France':'🇫🇷','Senegal':'🇸🇳','Iraq':'🇮🇶','Norway':'🇳🇴',
    'Argentina':'🇦🇷','Algeria':'🇩🇿','Austria':'🇦🇹','Jordan':'🇯🇴',
    'Portugal':'🇵🇹','Congo DR':'🇨🇩','Uzbekistan':'🇺🇿','Colombia':'🇨🇴',
    'England':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','Croatia':'🇭🇷','Ghana':'🇬🇭','Panama':'🇵🇦'
  };

  const GROUPS = {
    A:{color:'#22C55E',teams:['Mexico','South Africa','Korea Republic','Czechia']},
    B:{color:'#EF4444',teams:['Canada','Bosnia and Herzegovina','Qatar','Switzerland']},
    C:{color:'#F97316',teams:['Brazil','Morocco','Haiti','Scotland']},
    D:{color:'#3B82F6',teams:['USA','Paraguay','Australia','Türkiye']},
    E:{color:'#8B5CF6',teams:['Germany',"Côte d'Ivoire",'Curaçao','Ecuador']},
    F:{color:'#EAB308',teams:['Netherlands','Japan','Sweden','Tunisia']},
    G:{color:'#EC4899',teams:['Belgium','Egypt','IR Iran','New Zealand']},
    H:{color:'#06B6D4',teams:['Spain','Cabo Verde','Saudi Arabia','Uruguay']},
    I:{color:'#84CC16',teams:['France','Senegal','Iraq','Norway']},
    J:{color:'#14B8A6',teams:['Argentina','Algeria','Austria','Jordan']},
    K:{color:'#F59E0B',teams:['Portugal','Congo DR','Uzbekistan','Colombia']},
    L:{color:'#818CF8',teams:['England','Croatia','Ghana','Panama']}
  };

  // SVG silhouette poses (4 variants used by role)
  const SILHOUETTE_FORWARD = `
    <circle cx="30" cy="11" r="9.5"/>
    <path d="M17 23 Q30 18 43 23 L46 52 Q30 48 14 52 Z"/>
    <path d="M14 50 L9 76 L17 78 L21 53"/>
    <path d="M46 50 L51 76 L43 78 L39 53"/>
    <path d="M17 27 L2 14 L0 19 L16 33"/>
    <path d="M43 27 L58 12 L60 17 L44 33"/>
  `;
  const SILHOUETTE_MID = `
    <circle cx="30" cy="11" r="9.5"/>
    <path d="M17 23 Q30 19 43 23 L45 50 Q30 46 15 50 Z"/>
    <path d="M15 48 L10 74 L18 76 L22 51"/>
    <path d="M45 48 L50 74 L42 76 L38 51"/>
    <path d="M17 28 L4 22 L2 27 L16 35"/>
    <path d="M43 28 L58 20 L60 25 L44 35"/>
  `;
  const SILHOUETTE_LEGEND = `
    <circle cx="30" cy="10" r="10"/>
    <path d="M16 22 Q30 17 44 22 L47 54 Q30 50 13 54 Z"/>
    <path d="M13 52 L8 80 L16 82 L20 54"/>
    <path d="M47 52 L52 80 L44 82 L40 54"/>
    <path d="M16 27 L0 18 L-2 23 L15 33"/>
    <path d="M44 27 L60 16 L62 21 L45 33"/>
    <circle cx="46" cy="72" r="8"/>
  `;

  const PLAYERS = [
    {id:'messi',     name:'Messi',       fullName:'Lionel Messi',        country:'Argentina', number:'10', kitA:'#74ACDF', kitB:'#FFFFFF', role:'Delantero',   tier:'gold',   silhouette:SILHOUETTE_FORWARD},
    {id:'ronaldo',   name:'CR7',         fullName:'Cristiano Ronaldo',   country:'Portugal',  number:'7',  kitA:'#006600', kitB:'#FF0000', role:'Delantero',   tier:'gold',   silhouette:SILHOUETTE_FORWARD},
    {id:'mbappe',    name:'Mbappé',      fullName:'Kylian Mbappé',       country:'France',    number:'10', kitA:'#002654', kitB:'#FFFFFF', role:'Delantero',   tier:'gold',   silhouette:SILHOUETTE_FORWARD},
    {id:'james',     name:'James R.',    fullName:'James Rodríguez',     country:'Colombia',  number:'10', kitA:'#FCD116', kitB:'#003087', role:'Mediocampista',tier:'gold',   silhouette:SILHOUETTE_MID},
    {id:'vini',      name:'Vini Jr',     fullName:'Vinicius Jr.',        country:'Brazil',    number:'7',  kitA:'#009C3B', kitB:'#FFD700', role:'Delantero',   tier:'gold',   silhouette:SILHOUETTE_FORWARD},
    {id:'bellingham',name:'Bellingham',  fullName:'Jude Bellingham',    country:'England',   number:'10', kitA:'#003090', kitB:'#FFFFFF', role:'Mediocampista',tier:'silver', silhouette:SILHOUETTE_MID},
    {id:'pedri',     name:'Pedri',       fullName:'Pedri González',      country:'Spain',     number:'8',  kitA:'#AA151B', kitB:'#F1BF00', role:'Mediocampista',tier:'silver', silhouette:SILHOUETTE_MID},
    {id:'haaland',   name:'Haaland',     fullName:'Erling Haaland',      country:'Norway',    number:'9',  kitA:'#EF2B2D', kitB:'#FFFFFF', role:'Delantero',   tier:'silver', silhouette:SILHOUETTE_FORWARD},
    {id:'yamal',     name:'L. Yamal',    fullName:'Lamine Yamal',        country:'Spain',     number:'19', kitA:'#AA151B', kitB:'#F1BF00', role:'Delantero',   tier:'silver', silhouette:SILHOUETTE_FORWARD},
    {id:'pulisic',   name:'Pulisic',     fullName:'Christian Pulisic',   country:'USA',       number:'10', kitA:'#B22234', kitB:'#FFFFFF', role:'Delantero',   tier:'silver', silhouette:SILHOUETTE_FORWARD},
    {id:'rodrygo',   name:'Rodrygo',     fullName:'Rodrygo Goes',        country:'Brazil',    number:'11', kitA:'#FFD700', kitB:'#009C3B', role:'Delantero',   tier:'silver', silhouette:SILHOUETTE_FORWARD},
    {id:'debruyne',  name:'De Bruyne',   fullName:'Kevin De Bruyne',     country:'Belgium',   number:'8',  kitA:'#EF3340', kitB:'#000000', role:'Mediocampista',tier:'silver', silhouette:SILHOUETTE_MID},
    {id:'pele',      name:'Pelé',        fullName:'Pelé — O Rei',        country:'Brazil',    number:'10', kitA:'#009C3B', kitB:'#FFD700', role:'LEYENDA',     tier:'legend', silhouette:SILHOUETTE_LEGEND},
    {id:'muller',    name:'T. Müller',   fullName:'Thomas Müller',       country:'Germany',   number:'13', kitA:'#DDDDDD', kitB:'#000000', role:'Mediocampista',tier:'bronze', silhouette:SILHOUETTE_MID},
  ];

  const MATCHES = [
    {id:'m001',group:'A',home:'Mexico',                   away:'South Africa',       date:'2026-06-12T18:00',venue:'AT&T Stadium, Dallas',             status:'finished',homeScore:2,awayScore:1},
    {id:'m002',group:'A',home:'Korea Republic',            away:'Czechia',            date:'2026-06-12T21:00',venue:'SoFi Stadium, Los Angeles',         status:'finished',homeScore:1,awayScore:1},
    {id:'m003',group:'B',home:'Canada',                    away:'Switzerland',        date:'2026-06-13T15:00',venue:'BC Place, Vancouver',               status:'finished',homeScore:0,awayScore:2},
    {id:'m004',group:'B',home:'Bosnia and Herzegovina',    away:'Qatar',              date:'2026-06-13T18:00',venue:'Mercedes-Benz Stadium, Atlanta',    status:'finished',homeScore:3,awayScore:0},
    {id:'m005',group:'C',home:'Brazil',                    away:'Scotland',           date:'2026-06-14T15:00',venue:'MetLife Stadium, New York',          status:'finished',homeScore:4,awayScore:1},
    {id:'m006',group:'C',home:'Morocco',                   away:'Haiti',              date:'2026-06-14T18:00',venue:'Empower Field, Denver',              status:'finished',homeScore:2,awayScore:0},
    {id:'m007',group:'D',home:'USA',                       away:'Türkiye',            date:'2026-06-15T15:00',venue:"Levi's Stadium, San Francisco",      status:'finished',homeScore:1,awayScore:0},
    {id:'m008',group:'D',home:'Paraguay',                  away:'Australia',          date:'2026-06-15T18:00',venue:'Estadio Azteca, Ciudad de México',   status:'finished',homeScore:1,awayScore:1},
    {id:'m009',group:'E',home:'Germany',                   away:'Ecuador',            date:'2026-06-16T15:00',venue:'Gillette Stadium, Boston',           status:'finished',homeScore:2,awayScore:0},
    {id:'m010',group:'E',home:'Curaçao',                   away:"Côte d'Ivoire",      date:'2026-06-16T18:00',venue:'Arrowhead Stadium, Kansas City',    status:'finished',homeScore:1,awayScore:2},
    {id:'m011',group:'F',home:'Netherlands',               away:'Tunisia',            date:'2026-06-17T15:00',venue:'Lincoln Financial Field, Phila.',   status:'finished',homeScore:3,awayScore:0},
    {id:'m012',group:'F',home:'Japan',                     away:'Sweden',             date:'2026-06-17T18:00',venue:'Rose Bowl, Los Angeles',             status:'finished',homeScore:2,awayScore:2},
    {id:'m013',group:'G',home:'Belgium',                   away:'New Zealand',        date:'2026-06-18T15:00',venue:'SoFi Stadium, Los Angeles',         status:'finished',homeScore:3,awayScore:1},
    {id:'m014',group:'G',home:'Egypt',                     away:'IR Iran',            date:'2026-06-18T18:00',venue:'AT&T Stadium, Dallas',              status:'finished',homeScore:1,awayScore:1},
    {id:'m015',group:'H',home:'Spain',                     away:'Uruguay',            date:'2026-06-19T20:00',venue:'Hard Rock Stadium, Miami',           status:'live',    homeScore:1,awayScore:0,minute:67},
    {id:'m016',group:'H',home:'Cabo Verde',                away:'Saudi Arabia',       date:'2026-06-19T23:00',venue:'NRG Stadium, Houston',               status:'upcoming'},
    {id:'m017',group:'I',home:'France',                    away:'Norway',             date:'2026-06-20T15:00',venue:'MetLife Stadium, New York',          status:'upcoming'},
    {id:'m018',group:'I',home:'Senegal',                   away:'Iraq',               date:'2026-06-20T18:00',venue:'Empower Field, Denver',              status:'upcoming'},
    {id:'m019',group:'J',home:'Argentina',                 away:'Jordan',             date:'2026-06-21T15:00',venue:'MetLife Stadium, New York',          status:'upcoming'},
    {id:'m020',group:'J',home:'Algeria',                   away:'Austria',            date:'2026-06-21T18:00',venue:'AT&T Stadium, Dallas',              status:'upcoming'},
    {id:'m021',group:'K',home:'Portugal',                  away:'Uzbekistan',         date:'2026-06-22T15:00',venue:'SoFi Stadium, Los Angeles',         status:'upcoming'},
    {id:'m022',group:'K',home:'Colombia',                  away:'Congo DR',           date:'2026-06-22T18:00',venue:'Hard Rock Stadium, Miami',           status:'upcoming'},
    {id:'m023',group:'L',home:'England',                   away:'Panama',             date:'2026-06-23T15:00',venue:'Gillette Stadium, Boston',           status:'upcoming'},
    {id:'m024',group:'L',home:'Croatia',                   away:'Ghana',              date:'2026-06-23T18:00',venue:'Lincoln Financial Field, Phila.',   status:'upcoming'},
  ];

  function calculatePoints(bH, bA, rH, rA) {
    if (bH === rH && bA === rA) return 3;
    const bW = bH > bA ? 'H' : bH < bA ? 'A' : 'D';
    const rW = rH > rA ? 'H' : rH < rA ? 'A' : 'D';
    return bW === rW ? 1 : 0;
  }

  function canBet(matchDate, matchStatus) {
    if (matchStatus !== 'upcoming') return false;
    const deadline = new Date(matchDate).getTime() - 5 * 60 * 1000;
    return Date.now() < deadline;
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('es-CO', {weekday:'short', month:'short', day:'numeric'});
  }

  function fmtTime(iso) {
    return iso.split('T')[1] ? iso.split('T')[1].substring(0,5) : '';
  }

  return { FLAGS, GROUPS, PLAYERS, MATCHES, calculatePoints, canBet, fmtDate, fmtTime };
})();
