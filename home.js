/* ==========================================================
   BRACERUM/PARK — home.js
   Masterplan 3D embutido e mapa de localização. Os dados do mapa
   (POIs, rotas) só a home usa — ficavam no script.js e as seis
   páginas internas baixavam e interpretavam tudo à toa. Carregar
   depois do script.js: usa hasGsap, reduceMotion (script.js) e
   tr() (i18n.js).
   ========================================================== */

/* ==========================================================
   04 · MASTERPLAN 3D — a maquete de 3dmasterplan/ num iframe
   ========================================================== */
/* A vista aérea com pinos saiu em 2026-11-12 (pedido do cliente): no lugar
   dela entra a maquete 3D, a mesma página de /3dmasterplan/ em modo embutido.
   O src só é ligado quando a seção se aproxima da tela ou, antes disso, quando
   a home fica ociosa depois de carregar — assim a maquete não disputa a rede
   e a CPU com o hero, e costuma estar pronta quando o visitante chega nela.
   Com economia de dados ligada, só quando se aproxima. O idioma acompanha o
   seletor do site sozinho: a troca grava bp-lang e o iframe ouve 'storage'. */
(function masterplan3d(){
  const frame = document.getElementById("mp3d");
  if (!frame) return;
  let ligado = false;
  const ligar = () => {
    if (ligado) return;
    ligado = true;
    frame.src = frame.dataset.src;
  };

  if ("IntersectionObserver" in window){
    const io = new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting)){ io.disconnect(); ligar(); }
    }, { rootMargin: "0px 0px 25% 0px" });
    io.observe(frame);
  } else ligar();

  const poupa = navigator.connection && navigator.connection.saveData;
  if (!poupa){
    const ocioso = () => ("requestIdleCallback" in window)
      ? requestIdleCallback(ligar, { timeout: 4000 })
      : setTimeout(ligar, 1500);
    const depois = () => setTimeout(ocioso, 2500);   // o loader e a entrada do hero vão primeiro
    if (document.readyState === "complete") depois();
    else window.addEventListener("load", depois, { once: true });
  }
})();

/* ==========================================================
   05 · LOCALIZAÇÃO — mapa
   ========================================================== */
const PARK = { lat: -25.771694, lng: -57.732389 };

const T = {
  port:   { pt: "Porto fluvial", en: "River port", es: "Puerto fluvial" },
  road:   { pt: "Destino rodoviário", en: "Road destination", es: "Destino vial" },
  air:    { pt: "Aeroporto", en: "Airport", es: "Aeropuerto" },
  ref:    { pt: "Infraestrutura", en: "Infrastructure", es: "Infraestructura" },
  cap:    { pt: "Capital · distância aérea", en: "Capital · air distance", es: "Capital · distancia aérea" }
};

const ports = [
  { name: "Terport Villeta", type: T.port, km: "23 km", tempo: "20 min", lat: -25.5296, lng: -57.5568,
    img: "assets/pois/terport-villeta.jpg",
    credit: { pt: "Foto ilustrativa: barcaça porta-contêineres na hidrovia · Claudio Elias / Wikimedia Commons · Domínio público",
              en: "Illustrative photo: container barge on the waterway · Claudio Elias / Wikimedia Commons · Public domain",
              es: "Foto ilustrativa: barcaza portacontenedores en la hidrovía · Claudio Elias / Wikimedia Commons · Dominio público" },
    desc: { pt: "Terminal privado de contêineres mais moderno da hidrovia, aberto 24h o ano todo: US$ 40 milhões investidos, capacidade para 95 mil contêineres por ano e pátio para mais de 7.000 unidades, com guindastes elétricos de 38 m de alcance e sistema Navis N4. Fica no km 1.578,5 da hidrovia, ao sul dos passos de Itapirú e Guyratí — por isso opera mesmo na seca extrema, sem as filas dos portos de Assunção.",
            en: "The waterway's most modern private container terminal, open 24/7 year-round: US$ 40 million invested, capacity for 95,000 containers a year and a yard for over 7,000 units, with 38 m-reach electric cranes and the Navis N4 system. It sits at km 1,578.5 of the waterway, south of the Itapirú and Guyratí passes — so it keeps operating through extreme low water, without the queues of Asunción's ports.",
            es: "La terminal privada de contenedores más moderna de la hidrovía, abierta 24 h todo el año: US$ 40 millones invertidos, capacidad para 95.000 contenedores al año y patio para más de 7.000 unidades, con grúas eléctricas de 38 m de alcance y sistema Navis N4. Está en el km 1.578,5 de la hidrovía, al sur de los pasos Itapirú y Guyratí — por eso opera incluso en bajante extrema, sin las filas de los puertos de Asunción." } },
  { name: "Puerto Seguro Fluvial", type: T.port, km: "33 km", tempo: "30 min", lat: -25.4728, lng: -57.5539,
    img: "assets/pois/puerto-seguro.jpg",
    credit: { pt: "Foto ilustrativa: cinturão industrial de Villeta · Aterovi / Wikimedia Commons · Domínio público",
              en: "Illustrative photo: Villeta's industrial belt · Aterovi / Wikimedia Commons · Public domain",
              es: "Foto ilustrativa: cinturón industrial de Villeta · Aterovi / Wikimedia Commons · Dominio público" },
    desc: { pt: "Maior terminal multipropósito do Paraguai, em operação desde 2012 e em expansão: contêineres, carga solta, granel, rodados e carga de projeto no mesmo recinto. Opera com guindaste elétrico Liebherr FCC 280 (80 t) e guindaste móvel para peças de 260 a 300 t — a rota natural para o maquinário pesado que chega ao parque.",
            en: "Paraguay's largest multipurpose terminal, operating since 2012 and still expanding: containers, breakbulk, dry bulk, ro-ro and project cargo in one facility. It runs a Liebherr FCC 280 electric crane (80 t) and a mobile crane rated for 260–300 t lifts — the natural route for the heavy machinery arriving at the park.",
            es: "La mayor terminal multipropósito del Paraguay, en operación desde 2012 y en expansión: contenedores, carga suelta, granel, rodados y carga de proyecto en el mismo recinto. Opera con grúa eléctrica Liebherr FCC 280 (80 t) y grúa móvil para piezas de 260 a 300 t — la ruta natural para la maquinaria pesada que llega al parque." } },
  { name: "Caacupemí Villeta", type: T.port, km: "42 km", tempo: "1 h", lat: -25.5060, lng: -57.5450,
    img: "assets/pois/caacupemi.jpg",
    credit: { pt: "Foto ilustrativa: comboio de barcaças no rio · Falk2 / Wikimedia Commons · CC BY-SA 4.0",
              en: "Illustrative photo: barge convoy on the river · Falk2 / Wikimedia Commons · CC BY-SA 4.0",
              es: "Foto ilustrativa: convoy de barcazas en el río · Falk2 / Wikimedia Commons · CC BY-SA 4.0" },
    desc: { pt: "Terminal de contêineres com serviço regular de barcaças para Montevidéu e Buenos Aires, conectando a produção do parque ao Atlântico.",
            en: "Container terminal with regular barge service to Montevideo and Buenos Aires, connecting the park's output to the Atlantic.",
            es: "Terminal de contenedores con servicio regular de barcazas a Montevideo y Buenos Aires, conectando la producción del parque al Atlántico." } },
  { name: "Emb. Puerto Alegre", type: T.port, km: "4 km", tempo: "10 min", lat: -25.7930, lng: -57.7565,
    img: "assets/pois/puerto-alegre.jpg",
    credit: { pt: "Embarcações de carga no rio Paraguai · Cmasi / Wikimedia Commons · CC BY-SA 4.0",
              en: "Cargo vessels on the Paraguay River · Cmasi / Wikimedia Commons · CC BY-SA 4.0",
              es: "Embarcaciones de carga en el río Paraguay · Cmasi / Wikimedia Commons · CC BY-SA 4.0" },
    desc: { pt: "Atracadouro local a poucos minutos do portão do parque, usado para cargas de apoio e movimentação regional.",
            en: "Local wharf minutes from the park gate, used for support cargo and regional movements.",
            es: "Atracadero local a pocos minutos del portón del parque, usado para cargas de apoyo y movimiento regional." } },
  { name: "Puerto Lobato", type: T.port, km: "6 km", tempo: "15 min", lat: -25.8085, lng: -57.7660,
    img: "assets/pois/puerto-lobato.jpg",
    credit: { pt: "Foto ilustrativa: barcaça-tanque na hidrovia · Claudio Elias / Wikimedia Commons · Domínio público",
              en: "Illustrative photo: tanker barge on the waterway · Claudio Elias / Wikimedia Commons · Public domain",
              es: "Foto ilustrativa: barcaza tanque en la hidrovía · Claudio Elias / Wikimedia Commons · Dominio público" },
    desc: { pt: "Atracadouro fluvial vizinho ao parque, alternativa de curta distância para operações pontuais.",
            en: "River wharf next to the park, a short-distance alternative for occasional operations.",
            es: "Atracadero fluvial vecino al parque, alternativa de corta distancia para operaciones puntuales." } },
  { name: "Terminal Villa Oliva", type: T.port, km: "38 km", tempo: "50 min", lat: -26.0060, lng: -57.8890,
    img: "assets/pois/villa-oliva.jpg",
    credit: { pt: "Foto ilustrativa: navio atracado e guindastes no rio Paraguai · Cmasi / Wikimedia Commons · CC BY-SA 4.0",
              en: "Illustrative photo: moored ship and cranes on the Paraguay River · Cmasi / Wikimedia Commons · CC BY-SA 4.0",
              es: "Foto ilustrativa: buque atracado y grúas en el río Paraguay · Cmasi / Wikimedia Commons · CC BY-SA 4.0" },
    desc: { pt: "Terminal de barcaças e granéis ao sul de Villeta, com acesso direto à hidrovia.",
            en: "Barge and bulk terminal south of Villeta, with direct waterway access.",
            es: "Terminal de barcazas y graneles al sur de Villeta, con acceso directo a la hidrovía." } },
  { name: "Porto de Assunção", type: T.port, km: "71 km", tempo: "1 h 20", lat: -25.2780, lng: -57.6430,
    img: "assets/pois/porto-assuncao.jpg",
    credit: { pt: "Navio de carga atracado no Porto de Assunção · Cmasi / Wikimedia Commons · CC BY-SA 4.0",
              en: "Cargo ship moored at the Port of Asunción · Cmasi / Wikimedia Commons · CC BY-SA 4.0",
              es: "Buque de carga atracado en el Puerto de Asunción · Cmasi / Wikimedia Commons · CC BY-SA 4.0" },
    desc: { pt: "Porto histórico da capital, hoje voltado a carga geral. Villeta absorveu o fluxo de contêineres por ser mais próxima e menos congestionada.",
            en: "The capital's historic port, today focused on general cargo. Villeta absorbed container flows by being closer and less congested.",
            es: "Puerto histórico de la capital, hoy orientado a carga general. Villeta absorbió el flujo de contenedores por estar más cerca y menos congestionado." } },
  { name: "Porto de Alberdi", type: T.port, km: "72 km", tempo: "1 h", lat: -26.1870, lng: -58.1290,
    img: "assets/pois/porto-alberdi.jpg",
    credit: { pt: "Porto de Alberdi · Ulises Icardi / Wikimedia Commons · CC BY-SA 4.0",
              en: "Port of Alberdi · Ulises Icardi / Wikimedia Commons · CC BY-SA 4.0",
              es: "Puerto de Alberdi · Ulises Icardi / Wikimedia Commons · CC BY-SA 4.0" },
    desc: { pt: "Terminal fluvial ao sul, próximo à fronteira com a Argentina.",
            en: "Southern river terminal, close to the Argentine border.",
            es: "Terminal fluvial al sur, cerca de la frontera con Argentina." } }
];

const roads = [
  { name: "Assunção", type: T.road, km: "65 km", tempo: "1 h 10", lat: -25.2867, lng: -57.6470,
    img: "assets/pois/assuncao.jpg",
    credit: { pt: "Assunção vista do rio Paraguai · P. S. F. Freitas / Wikimedia Commons · CC BY-SA 4.0",
              en: "Asunción seen from the Paraguay River · P. S. F. Freitas / Wikimedia Commons · CC BY-SA 4.0",
              es: "Asunción vista desde el río Paraguay · P. S. F. Freitas / Wikimedia Commons · CC BY-SA 4.0" },
    desc: { pt: "Capital do Paraguai e sede dos órgãos federais (CNIME, aduana) — ida e volta no mesmo expediente pelo Acceso Sur.",
            en: "Paraguay's capital and seat of the federal bodies (CNIME, customs) — a round trip within the same working day via the Acceso Sur.",
            es: "Capital del Paraguay y sede de los órganos federales (CNIME, aduana) — ida y vuelta en la misma jornada por el Acceso Sur." } },
  { name: "Ciudad del Este", type: T.road, km: "360 km", tempo: "5 h", lat: -25.5097, lng: -54.6111,
    img: "assets/pois/ciudad-del-este.jpg",
    credit: { pt: "Centro de Ciudad del Este · Cmasi / Wikimedia Commons · CC BY-SA 4.0",
              en: "Downtown Ciudad del Este · Cmasi / Wikimedia Commons · CC BY-SA 4.0",
              es: "Centro de Ciudad del Este · Cmasi / Wikimedia Commons · CC BY-SA 4.0" },
    desc: { pt: "Segundo maior polo comercial do país, na tríplice fronteira com Brasil e Argentina.",
            en: "The country's second-largest commercial hub, on the triple border with Brazil and Argentina.",
            es: "Segundo mayor polo comercial del país, en la triple frontera con Brasil y Argentina." } },
  { name: "Foz do Iguaçu", type: T.road, km: "365 km", tempo: "5 h", lat: -25.5163, lng: -54.5854,
    img: "assets/pois/foz-do-iguacu.jpg",
    credit: { pt: "Ponte da Amizade, Foz do Iguaçu · Rodrigo Yoshioka / Wikimedia Commons · CC BY 2.0",
              en: "Friendship Bridge, Foz do Iguaçu · Rodrigo Yoshioka / Wikimedia Commons · CC BY 2.0",
              es: "Puente de la Amistad, Foz do Iguaçu · Rodrigo Yoshioka / Wikimedia Commons · CC BY 2.0" },
    desc: { pt: "Porta de entrada terrestre no Brasil: a carga sai do galpão e cruza a fronteira sem transbordo marítimo.",
            en: "Land gateway into Brazil: cargo leaves the warehouse and crosses the border with no sea transhipment.",
            es: "Puerta de entrada terrestre a Brasil: la carga sale del galpón y cruza la frontera sin transbordo marítimo." } },
  { name: "Curitiba", type: T.road, km: "1.000 km", tempo: "12 h 30", lat: -25.4284, lng: -49.2733,
    img: "assets/pois/curitiba.jpg",
    credit: { pt: "Centro de Curitiba · enioprado / Wikimedia Commons · CC BY-SA 3.0",
              en: "Downtown Curitiba · enioprado / Wikimedia Commons · CC BY-SA 3.0",
              es: "Centro de Curitiba · enioprado / Wikimedia Commons · CC BY-SA 3.0" },
    desc: { pt: "Um dia de caminhão até o centro industrial do Paraná — menos estoque em trânsito que a rota asiática.",
            en: "One truck day to Paraná's industrial centre — less inventory in transit than the Asian route.",
            es: "Un día de camión hasta el centro industrial de Paraná — menos stock en tránsito que la ruta asiática." } },
  { name: "Porto Alegre", type: T.road, km: "1.055 km", tempo: "14 h 30", lat: -30.0346, lng: -51.2177,
    img: "assets/pois/porto-alegre-rs.jpg",
    credit: { pt: "Porto Alegre · Ricardo Rmx / Wikimedia Commons · CC BY-SA 3.0",
              en: "Porto Alegre · Ricardo Rmx / Wikimedia Commons · CC BY-SA 3.0",
              es: "Porto Alegre · Ricardo Rmx / Wikimedia Commons · CC BY-SA 3.0" },
    desc: { pt: "Acesso rodoviário direto ao Rio Grande do Sul pela BR-386.",
            en: "Direct road access to Rio Grande do Sul via the BR-386.",
            es: "Acceso vial directo a Rio Grande do Sul por la BR-386." } },
  { name: "Encarnación", type: T.road, km: "355 km", tempo: "4 h 40", lat: -27.3306, lng: -55.8667,
    img: "assets/pois/encarnacion.jpg",
    credit: { pt: "Encarnación vista do rio Paraná · Falk2 / Wikimedia Commons · CC BY-SA 4.0",
              en: "Encarnación seen from the Paraná River · Falk2 / Wikimedia Commons · CC BY-SA 4.0",
              es: "Encarnación vista desde el río Paraná · Falk2 / Wikimedia Commons · CC BY-SA 4.0" },
    desc: { pt: "Fronteira com Posadas (Argentina) pela Ruta 1.",
            en: "Border with Posadas (Argentina) via Ruta 1.",
            es: "Frontera con Posadas (Argentina) por la Ruta 1." } },
  { name: "Buenos Aires", type: T.road, km: "1.280 km", tempo: "14 h 30", lat: -34.6037, lng: -58.3816,
    img: "assets/pois/buenos-aires.jpg",
    credit: { pt: "Puerto Madero, Buenos Aires · Vlasta x / Wikimedia Commons · CC BY-SA 4.0",
              en: "Puerto Madero, Buenos Aires · Vlasta x / Wikimedia Commons · CC BY-SA 4.0",
              es: "Puerto Madero, Buenos Aires · Vlasta x / Wikimedia Commons · CC BY-SA 4.0" },
    desc: { pt: "Maior mercado consumidor da Argentina, com tarifa zero pelo Certificado de Origem Mercosul.",
            en: "Argentina's largest consumer market, at zero tariff under the Mercosur Certificate of Origin.",
            es: "Mayor mercado consumidor de Argentina, con arancel cero por el Certificado de Origen Mercosur." } },
  { name: "Córdoba", type: T.road, km: "1.100 km", tempo: "13 h", lat: -31.4201, lng: -64.1888,
    img: "assets/pois/cordoba.jpg",
    credit: { pt: "Córdoba, Argentina · Juliana Rodríguez / Wikimedia Commons · CC BY 4.0",
              en: "Córdoba, Argentina · Juliana Rodríguez / Wikimedia Commons · CC BY 4.0",
              es: "Córdoba, Argentina · Juliana Rodríguez / Wikimedia Commons · CC BY 4.0" },
    desc: { pt: "Polo automotivo e agroindustrial argentino, acessível pela RN 16.",
            en: "Argentina's automotive and agro-industrial hub, reached via RN 16.",
            es: "Polo automotriz y agroindustrial argentino, accesible por la RN 16." } }
];

const airports = [
  { name: "Aeroporto Silvio Pettirossi (ASU)", type: T.air, km: "70 km", tempo: "1 h 15", lat: -25.2400, lng: -57.5200,
    img: "assets/pois/aeroporto-asu.jpg",
    credit: { pt: "Aeroporto Silvio Pettirossi · Fabioramireezz / Wikimedia Commons · CC0",
              en: "Silvio Pettirossi Airport · Fabioramireezz / Wikimedia Commons · CC0",
              es: "Aeropuerto Silvio Pettirossi · Fabioramireezz / Wikimedia Commons · CC0" },
    desc: { pt: "Aeroporto internacional de Assunção, com voos diários diretos para São Paulo (~2 h). Do portão de embarque ao portão do parque em cerca de uma hora.",
            en: "Asunción's international airport, with daily direct flights to São Paulo (~2 h). From boarding gate to park gate in about an hour.",
            es: "Aeropuerto internacional de Asunción, con vuelos diarios directos a São Paulo (~2 h). De la puerta de embarque al portón del parque en cerca de una hora." } },
  { name: "Pista do Bracerum Park", type: T.air, km: "0 km", tempo: "—", lat: -25.7790, lng: -57.7290,
    img: "assets/web/fotos/aero-pista-aerea.jpg",
    credit: { pt: "Render do masterplan · Bracerum Park",
              en: "Masterplan render · Bracerum Park",
              es: "Render del masterplan · Bracerum Park" },
    desc: { pt: "Pista de 1.480 m e heliponto dentro do masterplan, com hangar, lounge e abastecimento — acesso executivo sem depender de Assunção.",
            en: "A 1,480 m runway and helipad inside the masterplan, with hangar, lounge and refuelling — executive access without depending on Asunción.",
            es: "Pista de 1.480 m y helipuerto dentro del masterplan, con hangar, lounge y abastecimiento — acceso ejecutivo sin depender de Asunción." } },
  { name: "Aeroporto Guaraní (AGT)", type: T.air, km: "350 km", tempo: "4 h 50", lat: -25.4547, lng: -54.8428,
    img: "assets/pois/aeroporto-agt.jpg",
    credit: { pt: "Aeroporto Guaraní · CreBot / Wikimedia Commons · CC0",
              en: "Guaraní Airport · CreBot / Wikimedia Commons · CC0",
              es: "Aeropuerto Guaraní · CreBot / Wikimedia Commons · CC0" },
    desc: { pt: "Segundo aeroporto internacional do país, em Ciudad del Este, junto à fronteira brasileira.",
            en: "The country's second international airport, in Ciudad del Este, next to the Brazilian border.",
            es: "Segundo aeropuerto internacional del país, en Ciudad del Este, junto a la frontera brasileña." } }
];

/* Distâncias aéreas a partir de Assunção (ASU) — aproximadas */
const capitals = [
  { name: "São Paulo (GRU)", type: T.cap, km: "1.130 km", tempo: "~2 h", lat: -23.4356, lng: -46.4731,
    img: "assets/pois/gru.jpg",
    credit: { pt: "Aeroporto de Guarulhos (GRU) · Christopher Krause / Wikimedia Commons · CC BY-SA 3.0",
              en: "Guarulhos Airport (GRU) · Christopher Krause / Wikimedia Commons · CC BY-SA 3.0",
              es: "Aeropuerto de Guarulhos (GRU) · Christopher Krause / Wikimedia Commons · CC BY-SA 3.0" },
    desc: { pt: "Voos diários diretos. Ida e volta no mesmo dia é rotina para quem opera no parque.",
            en: "Daily direct flights. A same-day round trip is routine for those operating at the park.",
            es: "Vuelos diarios directos. Ida y vuelta en el mismo día es rutina para quien opera en el parque." } },
  { name: "Curitiba (CWB)", type: T.cap, km: "840 km", tempo: "~1 h 40", lat: -25.5285, lng: -49.1758,
    img: "assets/pois/curitiba-cwb.jpg",
    credit: { pt: "Rua XV de Novembro, Curitiba · enioprado / Wikimedia Commons · CC BY-SA 3.0",
              en: "Rua XV de Novembro, Curitiba · enioprado / Wikimedia Commons · CC BY-SA 3.0",
              es: "Rua XV de Novembro, Curitiba · enioprado / Wikimedia Commons · CC BY-SA 3.0" },
    desc: { pt: "A capital brasileira mais próxima de Villeta em linha reta.",
            en: "The closest Brazilian capital to Villeta as the crow flies.",
            es: "La capital brasileña más cercana a Villeta en línea recta." } },
  { name: "Porto Alegre (POA)", type: T.cap, km: "820 km", tempo: "~1 h 40", lat: -29.9939, lng: -51.1711,
    img: "assets/pois/porto-alegre-rs.jpg",
    credit: { pt: "Porto Alegre · Ricardo Rmx / Wikimedia Commons · CC BY-SA 3.0",
              en: "Porto Alegre · Ricardo Rmx / Wikimedia Commons · CC BY-SA 3.0",
              es: "Porto Alegre · Ricardo Rmx / Wikimedia Commons · CC BY-SA 3.0" },
    desc: { pt: "Distância aérea menor que São Paulo–Recife.",
            en: "A shorter air distance than São Paulo–Recife.",
            es: "Distancia aérea menor que São Paulo–Recife." } },
  { name: "Florianópolis (FLN)", type: T.cap, km: "930 km", tempo: "~1 h 50", lat: -27.6705, lng: -48.5477,
    img: "assets/pois/florianopolis.jpg",
    credit: { pt: "Ponte Hercílio Luz, Florianópolis · Daniel Becher / Wikimedia Commons · CC BY 2.0",
              en: "Hercílio Luz Bridge, Florianópolis · Daniel Becher / Wikimedia Commons · CC BY 2.0",
              es: "Puente Hercílio Luz, Florianópolis · Daniel Becher / Wikimedia Commons · CC BY 2.0" },
    desc: { pt: "Capital catarinense, região de origem de boa parte do capital industrial que migra para a maquila.",
            en: "Capital of Santa Catarina, home region of much of the industrial capital moving into the maquila regime.",
            es: "Capital de Santa Catarina, región de origen de buena parte del capital industrial que migra a la maquila." } },
  { name: "Brasília (BSB)", type: T.cap, km: "1.450 km", tempo: "~2 h 20", lat: -15.8711, lng: -47.9186,
    img: "assets/pois/brasilia.jpg",
    credit: { pt: "Brasília · Felipe de Lima Neves / Wikimedia Commons · CC BY 3.0",
              en: "Brasília · Felipe de Lima Neves / Wikimedia Commons · CC BY 3.0",
              es: "Brasilia · Felipe de Lima Neves / Wikimedia Commons · CC BY 3.0" },
    desc: { pt: "Capital federal brasileira, com conexões diárias via São Paulo.",
            en: "Brazil's federal capital, with daily connections via São Paulo.",
            es: "Capital federal brasileña, con conexiones diarias vía São Paulo." } },
  { name: "Rio de Janeiro (GIG)", type: T.cap, km: "1.470 km", tempo: "~2 h 30", lat: -22.8100, lng: -43.2506,
    img: "assets/pois/rio-de-janeiro.jpg",
    credit: { pt: "Pão de Açúcar, Rio de Janeiro · Boaventuravinicius / Wikimedia Commons · CC BY-SA 3.0",
              en: "Sugarloaf Mountain, Rio de Janeiro · Boaventuravinicius / Wikimedia Commons · CC BY-SA 3.0",
              es: "Pan de Azúcar, Río de Janeiro · Boaventuravinicius / Wikimedia Commons · CC BY-SA 3.0" },
    desc: { pt: "Mesma faixa de tempo de voo que um trecho doméstico brasileiro de média distância.",
            en: "The same flight-time range as a medium-haul domestic Brazilian leg.",
            es: "El mismo rango de tiempo de vuelo que un tramo doméstico brasileño de media distancia." } },
  { name: "Belo Horizonte (CNF)", type: T.cap, km: "1.520 km", tempo: "~2 h 30", lat: -19.6244, lng: -43.9719,
    img: "assets/pois/belo-horizonte.jpg",
    credit: { pt: "Belo Horizonte · Portal da Copa / ME / Wikimedia Commons · CC BY 3.0 BR",
              en: "Belo Horizonte · Portal da Copa / ME / Wikimedia Commons · CC BY 3.0 BR",
              es: "Belo Horizonte · Portal da Copa / ME / Wikimedia Commons · CC BY 3.0 BR" },
    desc: { pt: "Polo siderúrgico e automotivo de Minas Gerais.",
            en: "Minas Gerais' steel and automotive hub.",
            es: "Polo siderúrgico y automotriz de Minas Gerais." } }
];

const refs = [
  { name: "Subestação da ANDE", type: T.ref, km: "7,4 km", tempo: "10 min", lat: -25.7550, lng: -57.7600,
    img: "assets/pois/itaipu.jpg",
    credit: { pt: "Usina de Itaipu · International Hydropower Association / Wikimedia Commons · CC BY 2.0",
              en: "Itaipu power plant · International Hydropower Association / Wikimedia Commons · CC BY 2.0",
              es: "Central de Itaipú · International Hydropower Association / Wikimedia Commons · CC BY 2.0" },
    desc: { pt: "Subestação de média e alta tensão a 7 km do terreno, alimentada por Itaipu e Yacyretá — redundância energética para operação industrial contínua, com tarifa cerca de 60% menor que a média brasileira.",
            en: "Medium and high-voltage substation 7 km from the site, fed by Itaipu and Yacyretá — power redundancy for continuous industrial operation, at a tariff roughly 60% below the Brazilian average.",
            es: "Subestación de media y alta tensión a 7 km del terreno, alimentada por Itaipú y Yacyretá — redundancia energética para operación industrial continua, con tarifa cerca de 60% menor que la media brasileña." } }
];

(function locationMap(){
  const el = document.getElementById("locMap");
  if (!el || typeof L === "undefined" || !L.map) return;

  const map = L.map(el, { zoomControl: false, scrollWheelZoom: true }).setView([PARK.lat, PARK.lng], 10);
  L.control.zoom({ position: "bottomright" }).addTo(map);

  /* --- Basemap ---
     Mapa vetorial do OpenFreeMap (sem chave de API, uso comercial liberado),
     estilo dark repintado com a paleta do projeto. A água é desenhada pelo
     próprio mapa, com o traçado real dos rios — nada é sobreposto por cima.
     O CARTO foi abandonado porque passou a carimbar "API KEY REQUIRED".
     Sem WebGL, cai para um raster claro invertido por filtro CSS. */
  map.createPane("basePane");
  const basePane = map.getPane("basePane");
  basePane.style.zIndex = 200;

  const PALETA = {
    ink:   "#0e0d0b",
    ink2:  "#15140f",
    wood:  "#141610",
    water: "#1b4a6e",
    river: "#3d84b4",
    road:  "#3a3529",
    roadHi:"#5c5340",
    text:  "rgba(247,243,234,.78)",
    halo:  "rgba(14,13,11,.92)",
    wtext: "rgba(126,178,214,.9)"
  };

  function repaint(gl){
    const layers = gl.getStyle().layers || [];
    const set = (id, prop, val) => { try { gl.setPaintProperty(id, prop, val); } catch (e) {} };
    layers.forEach(l => {
      const id = l.id, sl = l["source-layer"] || "";
      if (l.type === "background") set(id, "background-color", PALETA.ink);
      else if (sl === "water" && l.type === "fill") set(id, "fill-color", PALETA.water);
      else if (sl === "waterway"){
        set(id, "line-color", PALETA.river);
        set(id, "line-opacity", .95);
        try { gl.setPaintProperty(id, "line-width",
          ["interpolate", ["linear"], ["zoom"], 6, 1.1, 10, 2.2, 14, 4]); } catch (e) {}
      }
      else if (sl === "water_name"){
        set(id, "text-color", PALETA.wtext); set(id, "text-halo-color", PALETA.halo);
      }
      else if (sl === "landcover" || sl === "landuse") set(id, "fill-color", PALETA.wood);
      else if (sl === "building") set(id, "fill-color", PALETA.ink2);
      else if (sl === "place"){
        set(id, "text-color", PALETA.text); set(id, "text-halo-color", PALETA.halo);
      }
      else if (sl.startsWith("transportation_name")){
        set(id, "text-color", "rgba(203,184,143,.72)"); set(id, "text-halo-color", PALETA.halo);
      }
      else if (sl === "transportation" && l.type === "line"){
        set(id, "line-color", /motorway|major/.test(id) ? PALETA.roadHi : PALETA.road);
      }
      else if (sl === "boundary") set(id, "line-color", "rgba(203,184,143,.28)");
      else if (sl === "aeroway") set(id, "line-color", PALETA.roadHi);
    });
  }

  const podeVetor = typeof L.maplibreGL === "function" &&
    typeof maplibregl !== "undefined" &&
    (!maplibregl.supported || maplibregl.supported());

  if (podeVetor){
    const vec = L.maplibreGL({
      style: "https://tiles.openfreemap.org/styles/dark",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &middot; OpenFreeMap',
      pane: "basePane", interactive: false
    }).addTo(map);
    const gl = vec.getMaplibreMap();
    gl.on("load", () => repaint(gl));
    gl.on("styledata", () => repaint(gl));
  } else {
    basePane.classList.add("leaflet-pane--base");
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
      attribution: "&copy; OpenStreetMap &middot; Esri", maxZoom: 16, pane: "basePane"
    }).addTo(map);
  }

  /* --- Park --- */
  const parkIcon = L.divIcon({
    className: "",
    html: '<div style="width:15px;height:15px;background:#f7f3ea;border:2.5px solid #0e0d0b;transform:rotate(45deg);box-shadow:0 0 0 6px rgba(247,243,234,.18)"></div>',
    iconSize: [15, 15], iconAnchor: [8, 8]
  });
  L.marker([PARK.lat, PARK.lng], { icon: parkIcon, zIndexOffset: 1000 }).addTo(map)
    .bindTooltip("Bracerum Park", { permanent: true, direction: "top", offset: [0, -12], className: "map-label map-label--park" });

  /* Área de toque de 28px em volta do ponto: no celular um alvo de 10px é
     pequeno demais e o usuário acaba clicando no mapa em vez do ponto. */
  const mkIcon = kind => L.divIcon({
    className: "poi-marker",
    html: `<span class="poi-marker__dot poi-marker__dot--${kind}"></span>`,
    iconSize: [28, 28], iconAnchor: [14, 14]
  });

  /* --- Card de POI --- */
  const card = document.getElementById("poiCard");
  const cEl = {
    media: card.querySelector(".poi-card__media"),
    type: card.querySelector(".poi-card__type"),
    title: card.querySelector(".poi-card__title"),
    km: card.querySelector("[data-poi-km]"),
    time: card.querySelector("[data-poi-time]"),
    desc: card.querySelector(".poi-card__desc"),
    route: card.querySelector(".poi-card__route")
  };
  let currentPoi = null;

  function openCard(p){
    currentPoi = p;
    cEl.type.textContent = tr(p.type);
    cEl.title.textContent = p.name;
    cEl.km.textContent = p.km;
    cEl.time.textContent = p.tempo;
    cEl.desc.textContent = tr(p.desc);
    cEl.media.innerHTML = p.img
      ? `<img src="${p.img}" alt="${p.name}" loading="lazy" />` +
        (p.credit ? `<span class="poi-card__credit">${tr(p.credit)}</span>` : "")
      : `<span class="poi-card__ph" data-i18n="loc.photoSlot">Foto do local</span>`;
    card.classList.add("is-open");
  }
  function closeCard(){ card.classList.remove("is-open"); currentPoi = null; }
  card.querySelector(".poi-card__close").addEventListener("click", closeCard);
  cEl.route.addEventListener("click", () => { if (currentPoi) drawRoute(currentPoi); });

  /* --- Rotas ---
     Para destinos rodoviários usamos o traçado real por vias, pré-calculado
     com o OSRM e guardado em assets/routes.json (sem chamada em tempo real).
     Para as capitais brasileiras, que são trechos aéreos, desenhamos um arco. */
  let ROUTES = {};
  fetch("assets/routes.json").then(r => r.ok ? r.json() : {}).then(j => { ROUTES = j; }).catch(() => {});

  let routeLayer = null;
  function arcPoints(a, b, bend = .18, n = 64){
    const pts = [];
    const midLat = (a[0] + b[0]) / 2, midLng = (a[1] + b[1]) / 2;
    const dLat = b[0] - a[0], dLng = b[1] - a[1];
    const cLat = midLat - dLng * bend, cLng = midLng + dLat * bend;
    for (let i = 0; i <= n; i++){
      const t = i / n, mt = 1 - t;
      pts.push([
        mt * mt * a[0] + 2 * mt * t * cLat + t * t * b[0],
        mt * mt * a[1] + 2 * mt * t * cLng + t * t * b[1]
      ]);
    }
    return pts;
  }

  function drawRoute(p){
    if (routeLayer) map.removeLayer(routeLayer);
    const real = ROUTES[p.name];
    const isAir = p._kind === "capital";
    const pts = (!isAir && real && real.pts.length > 1)
      ? real.pts
      : arcPoints([PARK.lat, PARK.lng], [p.lat, p.lng]);

    const style = (!isAir && real)
      ? { halo: { color: "#cbb88f", weight: 11, opacity: .16 },
          line: { color: "#cbb88f", weight: 3.2, opacity: .95, lineJoin: "round", lineCap: "round" } }
      : { halo: { color: "#cbb88f", weight: 10, opacity: .12 },
          line: { color: "#cbb88f", weight: 2.2, opacity: .9, dashArray: "5 8" } };

    routeLayer = L.layerGroup([
      L.polyline(pts, style.halo),
      L.polyline(pts, style.line)
    ]).addTo(map);

    map.fitBounds(L.latLngBounds(pts), {
      padding: [90, 90], maxZoom: 12, animate: !reduceMotion, duration: .9
    });
  }

  /* --- Marcadores --- */
  const groups = [
    { list: ports, kind: "port", ulId: "portList" },
    { list: roads, kind: "road", ulId: "roadList" },
    { list: airports, kind: "air", ulId: "airportList" },
    { list: capitals, kind: "capital", ulId: "capitalList" },
    { list: refs, kind: "ref", ulId: "refList" }
  ];

  /* Selecionar um ponto faz sempre a mesma coisa, venha o clique
     do marcador no mapa ou do item na lista lateral. */
  function selectPoi(p){
    document.querySelectorAll(".dist-item").forEach(d =>
      d.classList.toggle("is-active", d.dataset.poi === p.name));
    /* destaca o ponto no mapa, venha o clique da lista ou do próprio mapa */
    groups.forEach(g => g.list.forEach(o => {
      if (!o._marker) return;
      const on = o === p;
      const el = o._marker.getElement();
      if (el) el.classList.toggle("is-active", on);
      const tip = o._marker.getTooltip();
      const tipEl = tip && tip.getElement();
      if (tipEl) tipEl.classList.toggle("is-active", on);
    }));
    /* clicando no mapa, abre a sanfona do grupo e traz o item para a vista */
    const li = document.querySelector(`.dist-item[data-poi="${window.CSS && CSS.escape ? CSS.escape(p.name) : p.name}"]`);
    if (li){
      const acc = li.closest(".loc-acc");
      if (acc && acc.dataset.open === "false") acc.querySelector(".loc-acc__head").click();
      li.scrollIntoView({ block: "nearest" });
    }
    openCard(p);
    drawRoute(p);
  }

  function haversine(a, b){
    const R = 6371, toRad = d => d * Math.PI / 180;
    const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }

  groups.forEach(g => {
    g.list.forEach((p, i) => {
      const dir = i % 2 === 0 ? "right" : "left";
      const kind = g.kind === "capital" ? "air" : g.kind;
      const m = L.marker([p.lat, p.lng], {
        icon: mkIcon(kind), riseOnHover: true, keyboard: true, title: p.name, alt: p.name
      }).addTo(map);
      /* interactive: true faz o próprio rótulo abrir o cartão — é ele o alvo
         grande na tela; clicar nele e não acontecer nada confunde. */
      m.bindTooltip(`${p.name} · <b>${p.km}</b> · ${p.tempo}`, {
        permanent: true, interactive: true, direction: dir,
        offset: [dir === "right" ? 11 : -11, 0], className: "map-label"
      });
      m.on("click", () => selectPoi(p));
      m.on("keypress", e => { if (e.originalEvent && e.originalEvent.key === "Enter") selectPoi(p); });
      p._marker = m;
      p._kind = g.kind;
      // pontos muito próximos do Park só ganham rótulo quando há zoom suficiente
      p._minZoom = haversine(PARK, p) < 12 ? 11 : 0;
    });
  });

  function declutter(){
    const z = map.getZoom();
    groups.forEach(g => g.list.forEach(p => {
      const tip = p._marker.getTooltip();
      if (tip) tip.setOpacity(z >= p._minZoom ? 1 : 0);
    }));
  }
  map.on("zoomend", declutter);
  declutter();

  function renderLists(){
    groups.forEach(g => {
      const ul = document.getElementById(g.ulId);
      if (!ul) return;
      ul.innerHTML = "";
      g.list.forEach(p => {
        const li = document.createElement("li");
        li.className = "dist-item";
        li.dataset.poi = p.name;
        li.innerHTML = `<span>${p.name}</span><b>${p.km}</b><span class="t">${p.tempo}</span>`;
        li.addEventListener("click", () => selectPoi(p));
        ul.appendChild(li);
      });
      g.list.forEach(p => p._marker.setTooltipContent(`${p.name} · <b>${p.km}</b> · ${p.tempo}`));
    });
  }
  renderLists();

  /* --- Sanfonas do painel --- */
  document.querySelectorAll(".loc-acc__head").forEach(head => {
    head.addEventListener("click", () => {
      const acc = head.closest(".loc-acc");
      const isOpen = acc.getAttribute("data-open") === "true";
      document.querySelectorAll(".loc-acc").forEach(a => {
        a.setAttribute("data-open", "false");
        a.querySelector(".loc-acc__head").setAttribute("aria-expanded", "false");
      });
      acc.setAttribute("data-open", String(!isOpen));
      head.setAttribute("aria-expanded", String(!isOpen));
    });
  });

  document.getElementById("recenterBtn")?.addEventListener("click", () => {
    if (routeLayer){ map.removeLayer(routeLayer); routeLayer = null; }
    document.querySelectorAll(".dist-item").forEach(d => d.classList.remove("is-active"));
    closeCard();
    map.flyTo([PARK.lat, PARK.lng], 10, { duration: reduceMotion ? 0 : .8 });
  });

  /* --- Indicador: onde está o Park quando ele sai da tela --- */
  const indicator = document.getElementById("parkIndicator");
  const indArrow = indicator?.querySelector(".park-indicator__arrow");
  const indDist = indicator?.querySelector("[data-park-dist]");

  function updateIndicator(){
    if (!indicator) return;
    const parkLL = L.latLng(PARK.lat, PARK.lng);
    if (map.getBounds().contains(parkLL)){ indicator.classList.remove("is-on"); return; }

    const size = map.getSize();
    const pt = map.latLngToContainerPoint(parkLL);
    const cx = size.x / 2, cy = size.y / 2;
    const dx = pt.x - cx, dy = pt.y - cy;
    const angle = Math.atan2(dy, dx);

    const pad = 74;
    const halfW = Math.max(20, cx - pad), halfH = Math.max(20, cy - pad);
    const scale = Math.min(halfW / Math.abs(dx || 1e-6), halfH / Math.abs(dy || 1e-6));
    const x = cx + dx * scale, y = cy + dy * scale;

    indicator.style.left = x + "px";
    indicator.style.top = y + "px";
    indicator.style.transform = "translate(-50%,-50%)";
    indArrow.style.transform = `rotate(${angle + Math.PI / 2}rad)`;

    const center = map.getCenter();
    const km = haversine({ lat: center.lat, lng: center.lng }, PARK);
    indDist.textContent = (km < 10 ? km.toFixed(1) : Math.round(km).toLocaleString("pt-BR")) + " km";
    indicator.classList.add("is-on");
  }
  map.on("move zoom resize", updateIndicator);
  setTimeout(updateIndicator, 400);

  document.addEventListener("langchange", () => {
    renderLists();
    if (currentPoi) openCard(currentPoi);
  });
})();
