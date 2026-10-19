/* Masterplan 3D — Bracerum Park
   Maquete interativa da planta V12 (01/10/2026). Os dados vêm de data/scene.json, gerado por
   docs/3dmasterplan/build_data.py — posições, contornos e metragens saem da planta; as alturas são
   estimativas (o V12 não define altura de nada).

   Referencial: X e Z do mundo = X e Y da prancha (metros, Y da prancha para baixo), com a origem no
   centro da prancha; Y do mundo para cima. O norte aponta para a direita da prancha (`north`). */

import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';

const $ = (s) => document.querySelector(s);
const meta = (n, d) => document.querySelector(`meta[name="${n}"]`)?.content ?? d;
const ASSETS = meta('bp-assets', '../assets/');
const SITE = meta('bp-site', '../');
const COR_NEVOA = new THREE.Color().setRGB(231 / 255, 227 / 255, 216 / 255, THREE.SRGBColorSpace);
const QUERY = new URLSearchParams(location.search);
const LOW = QUERY.get('q') === 'low';
const COARSE = matchMedia('(pointer: coarse)').matches;
const SMALL = () => innerWidth <= 760;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ textos */
const T = {
  pt: {
    'ui.loading': 'Montando a maquete…', 'ui.eyebrow': 'Bracerum Park · Villeta, Paraguai',
    'ui.noWebgl': 'Este navegador não abriu a maquete 3D.',
    'ui.noWebglText': 'A visualização precisa de WebGL. Tente outro navegador ou um computador — enquanto isso, a imagem mostra o masterplan.',
    'ui.toSiteMp': 'Ver o masterplan no site', 'ui.backAria': 'Bracerum Park — voltar ao site', 'ui.title': 'Masterplan',
    'ui.version': 'Planta V12 · 01/10/2026', 'ui.back': 'Voltar ao site', 'ui.h1a': 'A cidade industrial', 'ui.h1b': 'em volume',
    'f.area': 'área total', 'f.front': 'de frente para a PY-19', 'f.lots': 'lotes industriais', 'f.runway': 'pista de pouso',
    'ui.areas': 'Áreas do parque',
    'ui.note': 'Maquete ilustrativa. Posições e metragens da planta V12; alturas e arquitetura são estimativas — o projeto não define altura dos prédios.',
    'ui.close': 'Fechar', 'ui.prev': 'Anterior', 'ui.next': 'Próxima', 'ui.toolsAria': 'Ferramentas da maquete',
    'ui.north': 'Norte para cima', 'ui.credit': 'Planta V12 (01/10/2026) · alturas estimadas · entorno', 'ui.stage': 'Maquete 3D do Bracerum Park',
    't.areas': 'Áreas', 't.home': 'Vista geral', 't.top': 'De cima', 't.rotate': 'Girar', 't.tour': 'Tour', 't.measure': 'Medir',
    't.labels': 'Rótulos', 't.sun': 'Hora do sol', 't.full': 'Tela cheia',
    'hint.desk': 'Arraste para girar · botão direito para mover · role para aproximar · clique numa área ou num lote',
    'hint.touch': 'Um dedo gira · dois dedos movem e aproximam · toque numa área ou num lote',
    'hint.measure': 'Clique em dois pontos do chão para medir · Esc para sair',
    'hint.tour': 'Tour pelas 12 áreas · toque na maquete para parar',
    'card.area': 'Área', 'card.site': 'Ver no site', 'card.contact': 'Falar com a equipe comercial',
    'card.nophoto': 'Ainda não há imagens desta área — o volume é uma estimativa a partir da planta.',
    'card.photo': 'Foto', 'tip.open': 'clique para ver',
    'lot.eyebrow': 'Lote industrial', 'lot.title': 'Lote', 'lot.front': 'Lote da frente', 'lot.edge': 'Lote de borda',
    'lot.area': 'área do lote, pela planta V12', 'lot.std': 'quadra-padrão · 16 módulos de 25 × 50 m',
    'lot.irreg': 'formato irregular, cortado pela borda do terreno ou pela pista',
    'lot.frontTxt': 'faixa de 433 × 50 m logo abaixo do Outlet', 'lot.sale': 'venda do lote inteiro ou em partes, a partir de um módulo de 1.250 m²',
    'lot.text': 'Os lotes industriais são vendidos — inteiros ou fracionados a partir de um módulo de 25 × 50 m. Fale com a equipe comercial para disponibilidade e condições.',
    'lot.grid': 'Coluna {c}, linha {l} da grade — referência desta maquete, não a numeração oficial dos lotes.',
    'lot.back': 'Todos os lotes', 'measure.label': 'Medida',
  },
  en: {
    'ui.loading': 'Building the model…', 'ui.eyebrow': 'Bracerum Park · Villeta, Paraguay',
    'ui.noWebgl': 'This browser could not open the 3D model.',
    'ui.noWebglText': 'The viewer needs WebGL. Try another browser or a computer — meanwhile, the image shows the master plan.',
    'ui.toSiteMp': 'See the master plan on the site', 'ui.backAria': 'Bracerum Park — back to the site', 'ui.title': 'Master plan',
    'ui.version': 'Plan V12 · 2026-10-01', 'ui.back': 'Back to the site', 'ui.h1a': 'The industrial city', 'ui.h1b': 'in three dimensions',
    'f.area': 'total area', 'f.front': 'of frontage on the PY-19', 'f.lots': 'industrial lots', 'f.runway': 'airstrip',
    'ui.areas': 'Areas of the park',
    'ui.note': 'Illustrative model. Positions and areas from plan V12; heights and architecture are estimates — the project does not define building heights.',
    'ui.close': 'Close', 'ui.prev': 'Previous', 'ui.next': 'Next', 'ui.toolsAria': 'Model tools',
    'ui.north': 'North up', 'ui.credit': 'Plan V12 (2026-10-01) · estimated heights · surroundings', 'ui.stage': 'Bracerum Park 3D model',
    't.areas': 'Areas', 't.home': 'Overview', 't.top': 'Top view', 't.rotate': 'Rotate', 't.tour': 'Tour', 't.measure': 'Measure',
    't.labels': 'Labels', 't.sun': 'Time of day', 't.full': 'Full screen',
    'hint.desk': 'Drag to rotate · right button to pan · scroll to zoom · click an area or a lot',
    'hint.touch': 'One finger rotates · two fingers pan and zoom · tap an area or a lot',
    'hint.measure': 'Click two points on the ground to measure · Esc to exit',
    'hint.tour': 'Tour of the 12 areas · tap the model to stop',
    'card.area': 'Area', 'card.site': 'See on the site', 'card.contact': 'Talk to the sales team',
    'card.nophoto': 'No images of this area yet — the volume is an estimate based on the plan.',
    'card.photo': 'Photo', 'tip.open': 'click to open',
    'lot.eyebrow': 'Industrial lot', 'lot.title': 'Lot', 'lot.front': 'Front lot', 'lot.edge': 'Edge lot',
    'lot.area': 'lot area, from plan V12', 'lot.std': 'standard block · 16 modules of 25 × 50 m',
    'lot.irreg': 'irregular shape, cut by the site boundary or the runway',
    'lot.frontTxt': '433 × 50 m strip just below the Outlet', 'lot.sale': 'the whole lot or part of it, from a single 1,250 m² module',
    'lot.text': 'Industrial lots are for sale — whole or split from a single 25 × 50 m module. Talk to the sales team about availability and terms.',
    'lot.grid': 'Column {c}, row {l} of the grid — a reference used in this model, not the official lot numbering.',
    'lot.back': 'All lots', 'measure.label': 'Distance',
  },
  es: {
    'ui.loading': 'Armando la maqueta…', 'ui.eyebrow': 'Bracerum Park · Villeta, Paraguay',
    'ui.noWebgl': 'Este navegador no abrió la maqueta 3D.',
    'ui.noWebglText': 'La visualización necesita WebGL. Pruebe otro navegador o una computadora — mientras tanto, la imagen muestra el masterplan.',
    'ui.toSiteMp': 'Ver el masterplan en el sitio', 'ui.backAria': 'Bracerum Park — volver al sitio', 'ui.title': 'Masterplan',
    'ui.version': 'Plano V12 · 01/10/2026', 'ui.back': 'Volver al sitio', 'ui.h1a': 'La ciudad industrial', 'ui.h1b': 'en volumen',
    'f.area': 'superficie total', 'f.front': 'de frente sobre la PY-19', 'f.lots': 'lotes industriales', 'f.runway': 'pista de aterrizaje',
    'ui.areas': 'Áreas del parque',
    'ui.note': 'Maqueta ilustrativa. Posiciones y superficies del plano V12; alturas y arquitectura son estimaciones — el proyecto no define la altura de los edificios.',
    'ui.close': 'Cerrar', 'ui.prev': 'Anterior', 'ui.next': 'Siguiente', 'ui.toolsAria': 'Herramientas de la maqueta',
    'ui.north': 'Norte arriba', 'ui.credit': 'Plano V12 (01/10/2026) · alturas estimadas · entorno', 'ui.stage': 'Maqueta 3D de Bracerum Park',
    't.areas': 'Áreas', 't.home': 'Vista general', 't.top': 'Desde arriba', 't.rotate': 'Girar', 't.tour': 'Recorrido', 't.measure': 'Medir',
    't.labels': 'Rótulos', 't.sun': 'Hora del sol', 't.full': 'Pantalla completa',
    'hint.desk': 'Arrastre para girar · botón derecho para mover · rueda para acercar · haga clic en un área o un lote',
    'hint.touch': 'Un dedo gira · dos dedos mueven y acercan · toque un área o un lote',
    'hint.measure': 'Haga clic en dos puntos del suelo para medir · Esc para salir',
    'hint.tour': 'Recorrido por las 12 áreas · toque la maqueta para detener',
    'card.area': 'Área', 'card.site': 'Ver en el sitio', 'card.contact': 'Hablar con el equipo comercial',
    'card.nophoto': 'Todavía no hay imágenes de esta área — el volumen es una estimación a partir del plano.',
    'card.photo': 'Foto', 'tip.open': 'clic para ver',
    'lot.eyebrow': 'Lote industrial', 'lot.title': 'Lote', 'lot.front': 'Lote del frente', 'lot.edge': 'Lote de borde',
    'lot.area': 'superficie del lote, según el plano V12', 'lot.std': 'manzana estándar · 16 módulos de 25 × 50 m',
    'lot.irreg': 'forma irregular, cortada por el borde del terreno o por la pista',
    'lot.frontTxt': 'franja de 433 × 50 m justo debajo del Outlet', 'lot.sale': 'venta del lote entero o en partes, desde un módulo de 1.250 m²',
    'lot.text': 'Los lotes industriales se venden — enteros o fraccionados desde un módulo de 25 × 50 m. Hable con el equipo comercial sobre disponibilidad y condiciones.',
    'lot.grid': 'Columna {c}, fila {l} de la grilla — referencia de esta maqueta, no la numeración oficial de los lotes.',
    'lot.back': 'Todos los lotes', 'measure.label': 'Medida',
  },
};

/* As 12 áreas: polígono e âncora em % da prancha (x da esquerda, y do topo), altura do pino (m),
   distância da câmera ao chegar, fotos do site e a página do site que fala do assunto. */
const AREAS = [
  { id: 'entrada', poly: [[39.2, 8.8], [48.9, 8.8], [48.9, 20.3], [39.2, 20.3]], at: [44.2, 14.6], ph: 42, dist: 560,
    name: { pt: 'Entrada e Clube do Caminhoneiro', en: 'Entrance and Truckers’ Club', es: 'Entrada y Club del Camionero' },
    short: { pt: 'Entrada', en: 'Entrance', es: 'Entrada' },
    kpis: [
      { n: 40065, u: 'm²', l: { pt: 'Clube do Caminhoneiro e pátio de caminhões', en: 'Truckers’ Club and truck yard', es: 'Club del Camionero y patio de camiones' } },
      { n: 7250, u: 'm²', l: { pt: 'posto, salão, restaurante, quadras e quiosques', en: 'fuel station, hall, restaurant, courts and kiosks', es: 'estación de servicio, salón, restaurante, canchas y quioscos' } },
      { n: 680, u: 'm²', l: { pt: 'Gate de acesso à área industrial', en: 'gate into the industrial area', es: 'portón de acceso al área industrial' } }],
    text: { pt: 'O acesso único pela PY-19 fica no meio da frente do parque: a alça leva à Via Costeira (13 m) e à rotatória do pátio de caminhões. O caminhão espera fora da área industrial — com posto, restaurante e quadra — e entra pelo Gate direto no boulevard central.',
      en: 'The single access from the PY-19 sits in the middle of the park’s frontage: a loop leads to the Via Costeira service road (13 m) and to the truck-yard roundabout. Trucks wait outside the industrial area — with a fuel station, restaurant and sports court — and enter through the gate straight onto the central boulevard.',
      es: 'El acceso único por la PY-19 está en el medio del frente del parque: el lazo lleva a la Vía Costera (13 m) y a la rotonda del patio de camiones. El camión espera fuera del área industrial — con estación de servicio, restaurante y cancha — y entra por el portón directo al bulevar central.' },
    photos: ['web/fotos/posto-caminhoes.jpg', 'web/fotos/portaria.jpg', 'park/select-apoio-caminhoes.jpg', 'park/select-posto-cobertura.jpg', 'park/vias-caminhoes.jpg'],
    link: 'select.html' },
  { id: 'outlet', poly: [[48.9, 8.8], [69.5, 8.8], [69.5, 47.8], [65.8, 47.8], [65.8, 15.9], [48.9, 15.9]], at: [57.6, 12.6], ph: 36, dist: 900,
    name: { pt: 'Outlet e Supermercado', en: 'Outlet and Supermarket', es: 'Outlet y Supermercado' },
    short: { pt: 'Outlet', en: 'Outlet', es: 'Outlet' },
    kpis: [
      { n: 57750, u: 'm²', l: { pt: 'Outlet, em L na frente da rodovia', en: 'L-shaped outlet facing the highway', es: 'Outlet en L frente a la ruta' } },
      { n: 4334, u: 'm²', l: { pt: 'Supermercado', en: 'supermarket', es: 'supermercado' } },
      { n: 433, u: 'm', l: { pt: 'de frente para a Via Costeira', en: 'of frontage on the Via Costeira', es: 'de frente sobre la Vía Costera' } }],
    text: { pt: 'Comércio ao lado da entrada: uma faixa ao longo da Via Costeira e outra que desce entre a área industrial e o acesso ao Resort, até o Supermercado. A arquitetura ainda não foi definida — os volumes aqui são ilustrativos.',
      en: 'Retail next to the entrance: one strip along the Via Costeira and another running down between the industrial area and the Resort access road, all the way to the supermarket. The architecture has not been defined yet — these volumes are illustrative.',
      es: 'Comercio junto a la entrada: una franja a lo largo de la Vía Costera y otra que baja entre el área industrial y el acceso al Resort, hasta el Supermercado. La arquitectura aún no está definida — los volúmenes son ilustrativos.' },
    photos: ['park/select-comercial-dia.jpg', 'park/select-fachada-brises.jpg', 'park/select-market-interior.jpg', 'park/select-comercial-noite.jpg'],
    link: 'select.html' },
  { id: 'industrial', poly: [[18.3, 8.8], [39.2, 8.8], [39.2, 20.3], [48.9, 20.3], [48.9, 15.9], [65.8, 15.9], [65.8, 80.8], [16.5, 80.8], [16.5, 63.3], [5, 63.3]],
    at: [38.5, 46], ph: 60, dist: 1900,
    name: { pt: 'Lotes industriais', en: 'Industrial lots', es: 'Lotes industriales' },
    short: { pt: 'Lotes industriais', en: 'Industrial lots', es: 'Lotes industriales' },
    kpis: [
      { n: 781777, u: 'm²', l: { pt: 'em 41 lotes industriais', en: 'across 41 industrial lots', es: 'en 41 lotes industriales' } },
      { v: '200 × 100 m', l: { pt: 'quadra-padrão de 20.000 m² — 32 dos 41 lotes', en: 'standard 20,000 m² block — 32 of the 41 lots', es: 'manzana estándar de 20.000 m² — 32 de los 41 lotes' } },
      { n: 1250, u: 'm²', l: { pt: 'venda a partir de um módulo de 25 × 50 m', en: 'for sale from a single 25 × 50 m module', es: 'venta desde un módulo de 25 × 50 m' } }],
    text: { pt: 'A grade industrial ocupa o miolo do parque: seis colunas de quadras separadas por vias com rotatórias, um boulevard arborizado em cada sentido e o canal de drenagem. Cada quadra-padrão se divide em 16 módulos e pode ser comprada inteira ou em partes. Clique num lote para ver a metragem.',
      en: 'The industrial grid fills the core of the park: six columns of blocks separated by streets with roundabouts, a tree-lined boulevard in each direction and the drainage canal. Each standard block splits into 16 modules and can be bought whole or in parts. Click a lot to see its size.',
      es: 'La grilla industrial ocupa el centro del parque: seis columnas de manzanas separadas por calles con rotondas, un bulevar arbolado en cada sentido y el canal de drenaje. Cada manzana estándar se divide en 16 módulos y puede comprarse entera o en partes. Haga clic en un lote para ver la superficie.' },
    photos: ['web/fotos/park-boulevard-aereo-2.jpg', 'web/fotos/galpao-docas.jpg', 'web/fotos/galpao-portico-azul.jpg', 'web/fotos/galpao-via.jpg', 'web/fotos/vias-rotatoria.jpg'],
    link: 'qualidade.html' },
  { id: 'tecnologico', poly: [[69.5, 9.6], [74.8, 9.6], [74.8, 17], [69.5, 17]], at: [71.9, 13.6], ph: 40, dist: 420,
    name: { pt: 'Centro Tecnológico e Espaço Business', en: 'Technology Center and Business Space', es: 'Centro Tecnológico y Espacio Business' },
    short: { pt: 'Centro Tecnológico', en: 'Technology Center', es: 'Centro Tecnológico' },
    kpis: [
      { n: 2340, u: 'm²', l: { pt: 'por piso', en: 'per floor', es: 'por piso' } },
      { t: { pt: 'dois edifícios espelhados, na esquina da Via Costeira com o acesso ao Resort', en: 'two mirrored buildings on the corner of the Via Costeira and the Resort access road', es: 'dos edificios espejados, en la esquina de la Vía Costera con el acceso al Resort' } }],
    text: { pt: 'É o primeiro edifício de quem chega à ponta norte pela via que leva ao Hotel e ao Resort: escritórios, coworking e salas de reunião para as empresas do parque.',
      en: 'It is the first building you reach at the north end, on the road to the Hotel and the Resort: offices, coworking and meeting rooms for the companies in the park.',
      es: 'Es el primer edificio de quien llega a la punta norte por la calle que lleva al Hotel y al Resort: oficinas, coworking y salas de reunión para las empresas del parque.' },
    photos: ['park/tec-fachada.jpg', 'park/tec-recepcao.jpg', 'park/tec-lounge.jpg', 'park/tec-coworking.jpg'] },
  { id: 'hotel', poly: [[74.8, 7.8], [91.6, 7.8], [91.6, 26.6], [81.4, 26.6], [81.4, 17], [74.8, 17]], at: [86.2, 16.4], ph: 78, dist: 680,
    name: { pt: 'Hotel e Centro de Convenções', en: 'Hotel and Convention Center', es: 'Hotel y Centro de Convenciones' },
    short: { pt: 'Hotel e Convenções', en: 'Hotel & Conventions', es: 'Hotel y Convenciones' },
    kpis: [
      { n: 384, u: 'studios', l: { pt: 'Hotel · 30.000 m²', en: 'hotel · 30,000 m²', es: 'hotel · 30.000 m²' } },
      { n: 13500, u: 'm²', l: { pt: 'Centro de Convenções, com anfiteatro de 1.200 lugares', en: 'convention center with a 1,200-seat amphitheater', es: 'centro de convenciones, con anfiteatro de 1.200 lugares' } },
      { n: 3200, u: 'm²', l: { pt: 'Salão de Eventos', en: 'event hall', es: 'salón de eventos' } },
      { n: 2036, u: { pt: 'vagas', en: 'spaces', es: 'plazas' }, l: { pt: 'estacionamento da cidade e do hotel', en: 'city and hotel parking', es: 'estacionamiento de la ciudad y del hotel' } }],
    text: { pt: 'A torre do hotel encosta na cobertura em casca do Centro de Convenções, na ponta norte, junto à Via Costeira. Ao lado ficam o Salão de Eventos e o estacionamento arborizado que atende a cidade e o hotel.',
      en: 'The hotel tower leans against the shell roof of the Convention Center at the north end, by the Via Costeira. Next to them are the event hall and the tree-lined parking that serves the city and the hotel.',
      es: 'La torre del hotel se apoya en la cubierta en cáscara del Centro de Convenciones, en la punta norte, junto a la Vía Costera. Al lado están el Salón de Eventos y el estacionamiento arbolado que atiende a la ciudad y al hotel.' },
    photos: ['web/fotos/hotel-cupula-dia.jpg', 'web/fotos/hotel-fachada-varandas.jpg', 'web/fotos/hotel-cupula-piscina.jpg', 'web/fotos/convencoes-foyer.jpg', 'web/fotos/convencoes-auditorio.jpg', 'park/amen-salao-eventos.jpg'],
    link: 'hotel.html' },
  { id: 'escola', poly: [[91.6, 10.5], [98.6, 10.5], [94.4, 26.6], [91.6, 26.6]], at: [94.6, 18.4], ph: 36, dist: 400,
    name: { pt: 'Escola', en: 'School', es: 'Escuela' }, short: { pt: 'Escola', en: 'School', es: 'Escuela' },
    kpis: [
      { n: 2775, u: 'm²', l: { pt: 'por piso', en: 'per floor', es: 'por piso' } },
      { t: { pt: 'quadra poliesportiva e parquinho à frente', en: 'multi-sport court and playground in front', es: 'cancha polideportiva y juegos infantiles al frente' } }],
    text: { pt: 'Edifício em arco no vértice norte do parque, perto do Resort e do Condomínio Vertical — para os filhos de quem mora e trabalha no Bracerum Park. Ao lado fica a estação de tratamento de água.',
      en: 'An arc-shaped building at the northern tip of the park, close to the Resort and the residential towers — for the children of people who live and work at Bracerum Park. The water treatment plant is next door.',
      es: 'Edificio en arco en el vértice norte del parque, cerca del Resort y del Condominio Vertical — para los hijos de quienes viven y trabajan en Bracerum Park. Al lado está la planta de tratamiento de agua.' },
    photos: [] },
  { id: 'resort', poly: [[69.5, 17], [81.4, 17], [81.4, 26.6], [94.4, 26.6], [81.6, 47.3], [69.5, 47.3]], at: [79.4, 30.5], ph: 36, dist: 860,
    name: { pt: 'Bracerum Resort', en: 'Bracerum Resort', es: 'Bracerum Resort' }, short: { pt: 'Resort', en: 'Resort', es: 'Resort' },
    kpis: [
      { n: 141, u: { pt: 'lotes', en: 'lots', es: 'lotes' }, l: { pt: 'casas em condomínio fechado', en: 'houses in a gated community', es: 'casas en barrio cerrado' } },
      { n: 142067, u: 'm²', l: { pt: 'área do Resort', en: 'Resort area', es: 'superficie del Resort' } },
      { t: { pt: 'lago central com coreto, clubhouse, piscinas, campo de futebol e quadras', en: 'central lake with a gazebo, clubhouse, pools, football pitch and courts', es: 'lago central con glorieta, clubhouse, piscinas, cancha de fútbol y canchas' } }],
    text: { pt: 'Condomínio fechado de casas na ponta norte: anéis de lotes em volta de uma praça e de um lago central, ruas curvas e um setor de lazer com clubhouse. Portaria própria na via de acesso. As casas da maquete são volumes genéricos — as plantas por unidade ainda serão definidas.',
      en: 'A gated community of houses at the north end: rings of lots around a square and a central lake, curving streets and a leisure area with a clubhouse. Its own gatehouse on the access road. The houses in this model are generic volumes — unit floor plans are still to be defined.',
      es: 'Barrio cerrado de casas en la punta norte: anillos de lotes alrededor de una plaza y de un lago central, calles curvas y un sector de recreación con clubhouse. Portería propia en la calle de acceso. Las casas de la maqueta son volúmenes genéricos — las plantas por unidad aún se definirán.' },
    photos: ['web/fotos/resort-lago.jpg', 'web/fotos/resort-casas-rua.jpg', 'web/fotos/resort-casa.jpg', 'park/resort-clubhouse.jpg', 'web/fotos/amen-piscina-quincho.jpg'],
    link: 'resort.html' },
  { id: 'condominio', poly: [[65.8, 47.8], [81.7, 47.3], [70.9, 78], [65.8, 78]], at: [73.4, 57], ph: 40, dist: 760,
    name: { pt: 'Condomínio Vertical', en: 'Residential Towers', es: 'Condominio Vertical' },
    short: { pt: 'Condomínio Vertical', en: 'Residential Towers', es: 'Condominio Vertical' },
    kpis: [
      { n: 608, u: { pt: 'apartamentos', en: 'apartments', es: 'departamentos' }, l: { pt: 'em 38 torres de 16 unidades', en: 'in 38 towers of 16 units', es: 'en 38 torres de 16 unidades' } },
      { n: 49704, u: 'm²', l: { pt: 'área do condomínio', en: 'site area', es: 'superficie del condominio' } },
      { t: { pt: 'salão de festas, campo society e quadras', en: 'party hall, five-a-side pitch and courts', es: 'salón de fiestas, cancha de fútbol 7 y canchas' } }],
    text: { pt: 'Moradia ao lado do trabalho: as torres se organizam em quatro grupos com espelhos d’água, entre o Resort e a área de serviços. Na maquete as torres têm 4 pavimentos, estimados pelo número de vagas desenhadas na planta.',
      en: 'Homes next to work: the towers are arranged in four groups with reflecting pools, between the Resort and the services area. In this model the towers have 4 floors, estimated from the number of parking spaces drawn on the plan.',
      es: 'Vivienda al lado del trabajo: las torres se organizan en cuatro grupos con espejos de agua, entre el Resort y el área de servicios. En la maqueta las torres tienen 4 pisos, estimados por la cantidad de estacionamientos dibujados en el plano.' },
    photos: [] },
  { id: 'servicos', poly: [[48.3, 80.8], [65.9, 80.8], [65.9, 85], [63.9, 90], [48.3, 90]], at: [56.4, 85.6], ph: 36, dist: 560,
    name: { pt: 'Refeitório, creche e ambulatório', en: 'Canteen, daycare and outpatient clinic', es: 'Comedor, guardería y ambulatorio' },
    short: { pt: 'Serviços', en: 'Services', es: 'Servicios' },
    kpis: [
      { n: 4639, u: 'm²', l: { pt: 'Refeitório / Espaço Zen', en: 'canteen / Zen space', es: 'comedor / Espacio Zen' } },
      { n: 2083, u: 'm²', l: { pt: 'Creche / Espaço Kids', en: 'daycare / Kids space', es: 'guardería / Espacio Kids' } },
      { n: 2377, u: 'm²', l: { pt: 'Ambulatório, resgate e brigadistas', en: 'outpatient clinic, rescue and fire brigade', es: 'ambulatorio, rescate y brigadistas' } },
      { n: 12180, u: 'm²', l: { pt: 'Hub de serviços para indústrias', en: 'industrial services hub', es: 'hub de servicios para industrias' } },
      { n: 2975, u: 'm²', l: { pt: 'Grêmio Recreativo', en: 'recreation club', es: 'club recreativo' } }],
    text: { pt: 'No fim do boulevard central, junto à pista, o bloco de serviços reúne refeitório, creche e ambulatório. Ao lado ficam o Hub de serviços para as indústrias e o Grêmio Recreativo, com campo society, quiosques e piscina.',
      en: 'At the end of the central boulevard, by the runway, the services block brings together the canteen, the daycare and the outpatient clinic. Next to it are the industrial services hub and the recreation club, with a five-a-side pitch, kiosks and a pool.',
      es: 'Al final del bulevar central, junto a la pista, el bloque de servicios reúne comedor, guardería y ambulatorio. Al lado están el Hub de servicios para las industrias y el Club Recreativo, con cancha de fútbol 7, quioscos y piscina.' },
    photos: ['park/amen-comedor.jpg'] },
  { id: 'pista', poly: [[1, 75], [16.5, 78.4], [48, 82.4], [60, 87.2], [62.5, 95], [60.5, 100], [1, 82]], at: [31, 84.5], ph: 30, dist: 1500,
    name: { pt: 'Pista de pouso', en: 'Airstrip', es: 'Pista de aterrizaje' }, short: { pt: 'Pista de pouso', en: 'Airstrip', es: 'Pista' },
    kpis: [
      { n: 1460, u: 'm', l: { pt: 'de pista', en: 'runway length', es: 'de pista' } },
      { n: 73750, u: 'm²', l: { pt: 'pista, heliponto, área de escape e manobra', en: 'runway, helipad, safety and maneuvering areas', es: 'pista, helipuerto, área de escape y maniobra' } }],
    text: { pt: 'A pista corre em diagonal ao longo de toda a borda leste do parque, com faixas verdes dos dois lados. Na ponta sul fica o pátio do Aeroporto de Cargas Bracerum, com os hangares e o heliponto.',
      en: 'The runway runs diagonally along the entire eastern edge of the park, with green strips on both sides. At the southern end is the apron of the Bracerum Cargo Airport, with the hangars and the helipad.',
      es: 'La pista corre en diagonal a lo largo de todo el borde este del parque, con franjas verdes a ambos lados. En la punta sur está la plataforma del Aeropuerto de Cargas Bracerum, con los hangares y el helipuerto.' },
    photos: ['web/fotos/aero-pista-aerea.jpg', 'web/fotos/aero-cabeceira.jpg'] },
  { id: 'aeroporto', poly: [[3, 63.3], [17, 63.3], [17, 77.6], [3, 76.2]], at: [9.6, 67.4], ph: 40, dist: 620,
    name: { pt: 'Aeroporto de Cargas Bracerum', en: 'Bracerum Cargo Airport', es: 'Aeropuerto de Cargas Bracerum' },
    short: { pt: 'Aeroporto', en: 'Airport', es: 'Aeropuerto' },
    kpis: [
      { n: 42060, u: 'm²', l: { pt: 'pátio do aeroporto de cargas', en: 'cargo airport apron', es: 'plataforma del aeropuerto de cargas' } },
      { n: 7686, u: 'm²', l: { pt: '7 hangares, lounge e abastecimento', en: '7 hangars, lounge and refueling', es: '7 hangares, lounge y abastecimiento' } },
      { t: { pt: 'heliponto no pátio dos hangares', en: 'helipad on the hangar apron', es: 'helipuerto en la plataforma de los hangares' } }],
    text: { pt: 'Os hangares ficam de frente para o pátio, com o estacionamento do aeródromo atrás e, no fim da fileira, o abastecimento e o heliponto. Carga e executivos chegam de avião direto ao parque.',
      en: 'The hangars face the apron, with the airfield parking behind them and, at the end of the row, the refueling point and the helipad. Cargo and executives fly straight into the park.',
      es: 'Los hangares dan a la plataforma, con el estacionamiento del aeródromo detrás y, al final de la fila, el abastecimiento y el helipuerto. Carga y ejecutivos llegan en avión directo al parque.' },
    photos: ['web/fotos/hangar-bracerum.jpg', 'web/fotos/aero-patio-jato.jpg', 'web/fotos/hangar-interior.jpg'] },
  { id: 'infra', poly: [[5.3, 51.2], [14.2, 51.2], [14.2, 63.3], [5.3, 63.3]], at: [9.6, 57.4], ph: 34, dist: 500,
    name: { pt: 'ETE, subestação e manutenção', en: 'Wastewater, substation and maintenance', es: 'Efluentes, subestación y mantenimiento' },
    short: { pt: 'Infraestrutura', en: 'Infrastructure', es: 'Infraestructura' },
    kpis: [
      { n: 14557, u: 'm²', l: { pt: 'E.T.E. e subestação de energia', en: 'wastewater treatment plant and power substation', es: 'planta de efluentes y subestación de energía' } },
      { n: 4125, u: 'm²', l: { pt: 'galpões de manutenção do Park', en: 'park maintenance sheds', es: 'galpones de mantenimiento del Park' } },
      { n: 1150, u: 'm²', l: { pt: 'Administração do Park', en: 'park administration', es: 'administración del Park' } },
      { n: 2665, u: 'm²', l: { pt: 'E.T.A., na outra ponta, junto à Escola', en: 'water treatment plant, at the other end, by the School', es: 'planta de agua, en la otra punta, junto a la Escuela' } }],
    text: { pt: 'Na ponta sul ficam a estação de tratamento de esgoto e a subestação de energia, separadas por uma faixa verde de 16 m, e os galpões de manutenção do próprio parque. A administração tem lote próprio na borda da grade industrial.',
      en: 'At the southern end are the wastewater treatment plant and the power substation, separated by a 16 m green strip, and the park’s own maintenance sheds. The administration has its own lot at the edge of the industrial grid.',
      es: 'En la punta sur están la planta de tratamiento de efluentes y la subestación de energía, separadas por una franja verde de 16 m, y los galpones de mantenimiento del propio parque. La administración tiene lote propio en el borde de la grilla industrial.' },
    photos: ['park/ete-eta.jpg'], link: 'qualidade.html' },
];
// ordem de teste do clique no chão: do mais específico ao mais amplo
// quando os rótulos se sobrepõem, ganha quem vem antes nesta lista
const PRIORIDADE = ['hotel', 'resort', 'industrial', 'entrada', 'outlet', 'pista', 'condominio', 'tecnologico', 'aeroporto', 'servicos', 'escola', 'infra'];
const HIT_ORDER = ['entrada', 'tecnologico', 'hotel', 'escola', 'outlet', 'resort', 'condominio', 'servicos', 'infra', 'aeroporto', 'pista', 'industrial'];
const TAG_AREA = {
  'posto e portaria': 'entrada', outlet: 'outlet', supermercado: 'outlet', 'galpão': 'industrial',
  'centro tecnológico': 'tecnologico', hotel: 'hotel', 'salão de eventos': 'hotel', casca: 'hotel', escola: 'escola',
  casa: 'resort', 'casa-clube': 'resort', torre: 'condominio', 'salão de festas': 'condominio',
  'refeitório, creche, ambulatório': 'servicos', 'hub de serviços': 'servicos', 'grêmio': 'servicos',
  hangar: 'aeroporto', abastecimento: 'aeroporto', ETE: 'infra', 'subestação': 'infra', 'galpões de manutenção': 'infra',
  'administração': 'infra', ETA: 'infra',
};
// fachada e telhado por tipo de volume; cor em RGB 0–1 (multiplica a cor do material)
const ESTILO = {
  'galpão': ['w_metal', 'r_metal', [1, 1, 1]], hangar: ['w_metal', 'r_metal', [0.98, 0.98, 0.98]],
  'galpões de manutenção': ['w_metal', 'r_metal', [0.97, 0.97, 0.96]],
  hotel: ['w_floor', 'r_flat', [1, 0.975, 0.94]], torre: ['w_floor', 'r_flat', [1, 0.985, 0.96]],
  'centro tecnológico': ['w_floor', 'r_flat', [0.97, 0.97, 0.97]], escola: ['w_floor', 'r_flat', [1, 0.98, 0.95]],
  'administração': ['w_floor', 'r_flat', [1, 1, 1]], 'refeitório, creche, ambulatório': ['w_floor', 'r_flat', [1, 0.98, 0.95]],
  'hub de serviços': ['w_floor', 'r_flat', [1, 1, 1]], outlet: ['w_shop', 'r_flat', [1, 0.985, 0.96]],
  supermercado: ['w_shop', 'r_flat', [1, 1, 1]], 'posto e portaria': ['w_shop', 'r_flat', [1, 1, 1]],
  'salão de eventos': ['w_shop', 'r_flat', [1, 0.98, 0.95]], casa: ['w_house', 'r_house', [1, 1, 1]],
};

let lang = 'pt';
try { lang = localStorage.getItem('bp-lang') || ''; } catch (e) { /* sem storage */ }
if (!T[lang]) lang = (navigator.language || 'pt').slice(0, 2).toLowerCase();
if (!T[lang]) lang = 'pt';
const t = (k) => T[lang][k] ?? T.pt[k] ?? k;
const tr = (o) => (o == null ? '' : typeof o === 'string' ? o : o[lang] ?? o.pt);
const fmt = (n) => new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'pt-BR').format(n);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/* ------------------------------------------------------------------ estado */
let S, W, H, renderer, scene, camera, controls, sun, hemi, shadowCatcher, parkMat, ctxMat;
const pickables = [];
const U = { sel: { value: -1 }, hov: { value: -1 }, mix: { value: 0 }, tint: { value: new THREE.Color('#e3c98f') },
  focus: { value: new THREE.Vector4(0, 0, 1e5, 0) } };
const areaIdx = Object.fromEntries(AREAS.map((a, i) => [a.id, i]));
let selected = null;        // {kind:'area', i} | {kind:'lot', lot}
let hovered = -1, mixTarget = 0, dirty = true, flight = null, tour = null, measure = null;
const lotLayer = new THREE.Group();

const pct = (p) => [p[0] / 100 * W - W / 2, p[1] / 100 * H - H / 2];
const toWorld = (X, Y) => [X - W / 2, Y - H / 2];
function inPoly(x, y, pts) {
  let ins = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}
const pairs = (flat) => { const o = []; for (let i = 0; i < flat.length; i += 2) o.push([flat[i], flat[i + 1]]); return o; };
const invalidate = () => { dirty = true; };

/* ------------------------------------------------------------------ texturas desenhadas */
function canvasTex(w, h, draw, pu, pv) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  tx.repeat.set(1 / pu, 1 / pv);
  tx.anisotropy = 4;
  return tx;
}
const TEX = {
  floor: () => canvasTex(128, 64, (g, w, h) => {                    // pavimentos de 3,4 m, faixa de vidro
    g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#a7a39b'; g.fillRect(0, 16, w, 34);
    g.fillStyle = '#c9c5bc'; for (let x = 0; x < w; x += 32) g.fillRect(x, 16, 2, 34);
    g.fillStyle = '#e6e2da'; g.fillRect(0, 50, w, 3);
  }, 6, 3.4),
  metal: () => canvasTex(64, 64, (g, w, h) => {                     // telha metálica e rodapé
    g.fillStyle = '#efefed'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e3e3e0'; for (let x = 0; x < w; x += 4) g.fillRect(x, 0, 2, h);
    g.fillStyle = '#d5d4d0'; g.fillRect(0, h - 5, w, 5);
  }, 4, 12),
  shop: () => canvasTex(64, 64, (g, w, h) => {                      // vitrine embaixo, platibanda em cima
    g.fillStyle = '#f2efe9'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#9f9b93'; g.fillRect(0, 33, w, 28);
    g.fillStyle = '#cbc6bd'; for (let x = 0; x < w; x += 16) g.fillRect(x, 33, 2, 28);
    g.fillStyle = '#d9d4cb'; g.fillRect(0, 30, w, 3);
  }, 6, 9),
  roof: () => canvasTex(64, 8, (g, w, h) => {                       // faixas de iluminação zenital a cada 12 m
    g.fillStyle = '#f0f0ee'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#d2d5d6'; g.fillRect(29, 0, 6, h);
  }, 12, 12),
  casca: () => canvasTex(128, 128, (g, w, h) => {                   // malha da casca (gridshell)
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(226,232,233,0.62)'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,253,1)'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h);
    g.moveTo(-w / 2, h / 2); g.lineTo(w / 2, -h / 2); g.moveTo(w / 2, h * 1.5); g.lineTo(w * 1.5, h / 2);
    g.moveTo(w / 2, -h / 2); g.lineTo(w * 1.5, h / 2); g.moveTo(-w / 2, h / 2); g.lineTo(w / 2, h * 1.5);
    g.stroke();
  }, 9, 9),
};

/* Destaque por área no próprio shader: cada vértice carrega o índice da área (aArea). */
function realcar(mat) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uSel: U.sel, uHov: U.hov, uMix: U.mix, uTint: U.tint });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aArea;\nvarying float vArea;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvArea = aArea;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vArea;\nuniform float uSel, uHov, uMix;\nuniform vec3 uTint;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float bpSel = 1.0 - step(0.5, abs(vArea - uSel));
        float bpHov = 1.0 - step(0.5, abs(vArea - uHov));
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * uTint, bpSel * uMix);
        float bpLum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(bpLum) * 0.94, (1.0 - bpSel) * uMix * 0.45);
        diffuseColor.rgb *= 1.0 + 0.10 * bpHov;`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uTint * 0.07 * bpSel * uMix;');
  };
  mat.customProgramCacheKey = () => 'bp-realce';
  return mat;
}
/* Holofote no chão: fora do raio da área selecionada, o chão escurece um pouco. */
function holofote(mat) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uFocus = U.focus;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vBpXZ;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBpXZ = (modelMatrix * vec4(transformed, 1.0)).xz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vBpXZ;\nuniform vec4 uFocus;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float bpF = smoothstep(uFocus.z, uFocus.z * 1.7, distance(vBpXZ, uFocus.xy));
        diffuseColor.rgb *= 1.0 - 0.22 * bpF * uFocus.w;`);
  };
  mat.customProgramCacheKey = () => 'bp-holofote';
  return mat;
}

/* ------------------------------------------------------------------ geometria dos volumes */
class Acc {
  constructor() { this.p = []; this.n = []; this.uv = []; this.c = []; this.a = []; }
  v(P, N, u, v, c, a) { this.p.push(P[0], P[1], P[2]); this.n.push(N[0], N[1], N[2]); this.uv.push(u, v); this.c.push(c[0], c[1], c[2]); this.a.push(a); }
  tri(A, B, C, N, uvs, cs, a) { this.v(A, N, uvs[0][0], uvs[0][1], cs[0], a); this.v(B, N, uvs[1][0], uvs[1][1], cs[1], a); this.v(C, N, uvs[2][0], uvs[2][1], cs[2], a); }
  geom() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aArea', new THREE.Float32BufferAttribute(this.a, 1));
    g.computeBoundingSphere();
    return g;
  }
}
const scale3 = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
function area2(pts) { let s = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; s += p[0] * q[1] - q[0] * p[1]; } return s / 2; }

function paredes(acc, pts, h, a, cor, base = 0, rodape = true) {
  const hb = rodape ? Math.min(4, h - base) : 0;
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    const dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz);
    if (L < 0.05) continue;
    const N = [dz / L, 0, -dx / L];
    const faixas = hb > 0 ? [[base, base + hb, 0.76, 1], [base + hb, h, 1, 1]] : [[base, h, 1, 1]];
    for (const [y0, y1, c0, c1] of faixas) {
      if (y1 - y0 < 0.01) continue;
      const A = [p[0], y0, p[1]], B = [q[0], y0, q[1]], C = [q[0], y1, q[1]], D = [p[0], y1, p[1]];
      const ca = scale3(cor, c0), cb = scale3(cor, c1);
      acc.tri(A, C, B, N, [[s, y0], [s + L, y1], [s + L, y0]], [ca, cb, ca], a);
      acc.tri(A, D, C, N, [[s, y0], [s, y1], [s + L, y1]], [ca, cb, cb], a);
    }
    s += L;
  }
}
function telhado(acc, pts, h, a, cor) {
  const tris = THREE.ShapeUtils.triangulateShape(pts.map((p) => new THREE.Vector2(p[0], p[1])), []);
  const N = [0, 1, 0];
  for (let [i, j, k] of tris) {
    const A = pts[i], B = pts[j], C = pts[k];
    if ((B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]) > 0) [j, k] = [k, j];
    const P = [pts[i], pts[j], pts[k]];
    acc.tri([P[0][0], h, P[0][1]], [P[1][0], h, P[1][1]], [P[2][0], h, P[2][1]], N, P.map((p) => [p[0], p[1]]), [cor, cor, cor], a);
  }
}
function face(acc, P, a, cor) {                // polígono plano qualquer (telhado de casa), virado para cima
  const e1 = new THREE.Vector3().subVectors(new THREE.Vector3(...P[1]), new THREE.Vector3(...P[0]));
  const e2 = new THREE.Vector3().subVectors(new THREE.Vector3(...P[2]), new THREE.Vector3(...P[0]));
  const n = new THREE.Vector3().crossVectors(e1, e2).normalize();
  if (n.y < 0) { P = P.slice().reverse(); n.negate(); }
  const N = [n.x, n.y, n.z];
  for (let i = 1; i < P.length - 1; i++) acc.tri(P[0], P[i], P[i + 1], N, [[P[0][0], P[0][2]], [P[i][0], P[i][2]], [P[i + 1][0], P[i + 1][2]]], [cor, cor, cor], a);
}
function casa(accW, accR, pts, h, a) {
  let [p0, p1, p2, p3] = pts;
  if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < Math.hypot(p2[0] - p1[0], p2[1] - p1[1])) [p0, p1, p2, p3] = [p1, p2, p3, p0];
  const S = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
  const hw = h * 0.55, hr = hw + Math.min(3.0, S * 0.26);
  paredes(accW, [p0, p1, p2, p3], hw, a, [1, 0.985, 0.96]);
  const ux = (p1[0] - p0[0]), uz = (p1[1] - p0[1]), L = Math.hypot(ux, uz), k = Math.min(0.5, (S / 2) / L);
  const m03 = [(p0[0] + p3[0]) / 2, (p0[1] + p3[1]) / 2], m12 = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
  const r1 = [m03[0] + ux * k, hr, m03[1] + uz * k], r2 = [m12[0] - ux * k, hr, m12[1] - uz * k];
  const v = (p) => [p[0], hw, p[1]];
  const cor = [1, 1, 1];
  face(accR, [v(p0), v(p1), r2, r1], a, cor);
  face(accR, [v(p2), v(p3), r1, r2], a, scale3(cor, 0.93));
  face(accR, [v(p1), v(p2), r2], a, scale3(cor, 0.96));
  face(accR, [v(p3), v(p0), r1], a, scale3(cor, 0.9));
}

function volumes() {
  const accs = {};
  const acc = (k) => (accs[k] ||= new Acc());
  for (const v of S.vol) {
    let pts = pairs(v.p).map((p) => toWorld(p[0], p[1]));
    if (area2(pts) < 0) pts.reverse();
    const ai = areaIdx[TAG_AREA[v.t]] ?? -1;
    const [ws, rs, cor] = ESTILO[v.t] || ['w_plain', 'r_flat', [0.99, 0.985, 0.975]];
    if (v.t === 'casa' && pts.length === 4) { casa(acc(ws), acc(rs), pts, v.h, ai); continue; }
    paredes(acc(ws), pts, v.h, ai, cor);
    telhado(acc(rs), pts, v.h, ai, cor);
  }
  const std = (o) => realcar(new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, vertexColors: true, ...o }));
  const M = {
    w_floor: std({ map: TEX.floor(), color: '#ffffff' }), w_metal: std({ map: TEX.metal() }), w_shop: std({ map: TEX.shop() }),
    w_plain: std({ color: '#f1f0ec' }), w_house: std({ color: '#f5f0e6' }),
    r_flat: std({ color: '#f2f1ed' }), r_metal: std({ map: TEX.roof() }), r_house: std({ color: '#b6a385', roughness: 0.85 }),
  };
  const g = new THREE.Group();
  for (const [k, a] of Object.entries(accs)) {
    const mesh = new THREE.Mesh(a.geom(), M[k] || M.w_plain);
    mesh.castShadow = true; mesh.receiveShadow = true;
    g.add(mesh); pickables.push(mesh);
  }
  return g;
}

function casca() {
  const c = S.casca, z = Uint8Array.from(atob(c.z), (ch) => ch.charCodeAt(0));
  const Hh = (i, j) => z[j * c.w + i] / 10;
  const pos = [], idx = [], uv = [], ar = [];
  const ai = areaIdx.hotel;
  const vid = new Int32Array(c.w * c.h).fill(-1);
  const vert = (i, j) => {
    const k = j * c.w + i;
    if (vid[k] < 0) {
      const [x, zz] = toWorld(c.x0 + (i + 0.5) * c.res, c.y0 + (j + 0.5) * c.res);
      vid[k] = pos.length / 3; pos.push(x, Hh(i, j), zz); uv.push(x, zz); ar.push(ai);
    }
    return vid[k];
  };
  for (let j = 0; j < c.h - 1; j++) for (let i = 0; i < c.w - 1; i++) {
    if (Hh(i, j) + Hh(i + 1, j) + Hh(i, j + 1) + Hh(i + 1, j + 1) <= 0) continue;
    const a = vert(i, j), b = vert(i + 1, j), d = vert(i, j + 1), e = vert(i + 1, j + 1);
    idx.push(a, d, b, b, d, e);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aArea', new THREE.Float32BufferAttribute(ar, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = realcar(new THREE.MeshStandardMaterial({ map: TEX.casca(), transparent: true, roughness: 0.3, metalness: 0,
    side: THREE.DoubleSide, depthWrite: false, emissive: '#dfe3e2', emissiveIntensity: 0.18 }));
  const mesh = new THREE.Mesh(g, m);
  mesh.castShadow = true; mesh.renderOrder = 2;
  pickables.push(mesh);
  return mesh;
}

function arvores() {
  const copa = new THREE.IcosahedronGeometry(1, 1);
  copa.scale(3.3, 3.0, 3.3); copa.translate(0, 6.0, 0);
  const tronco = new THREE.CylinderGeometry(0.22, 0.32, 3.6, 6);
  tronco.translate(0, 1.8, 0);
  const pinta = (geo, c) => { const g = geo.index ? geo.toNonIndexed() : geo; const n = g.attributes.position.count; g.setAttribute('color', new THREE.Float32BufferAttribute(new Array(n).fill(c).flat(), 3)); return g; };
  const geo = mergeGeometries([pinta(copa, [0.47, 0.58, 0.37]), pinta(tronco, [0.45, 0.39, 0.31])]);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 });
  const n = S.arvores.length / 3;
  const inst = new THREE.InstancedMesh(geo, mat, n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color();
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) {
    const [x, z] = toWorld(S.arvores[i * 3], S.arvores[i * 3 + 1]), s = S.arvores[i * 3 + 2];
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * Math.PI * 2);
    sc.set(s, s * (0.9 + rnd() * 0.25), s);
    m4.compose(p.set(x, 0, z), q, sc);
    inst.setMatrixAt(i, m4);
    inst.setColorAt(i, col.setScalar(0.86 + rnd() * 0.24));
  }
  inst.castShadow = !COARSE;
  inst.raycast = () => {};
  return inst;
}

function fita(pts, largura, y, fechar = true) {   // faixa plana ao longo de uma linha (contorno, lote, medida)
  const pos = [];
  const n = pts.length, m = fechar ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    const dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz) || 1;
    const ox = (-dz / L) * largura / 2, oz = (dx / L) * largura / 2;
    const ext = largura / 2 / L;
    const a = [p[0] - dx * ext, p[1] - dz * ext], b = [q[0] + dx * ext, q[1] + dz * ext];
    pos.push(a[0] - ox, y, a[1] - oz, b[0] - ox, y, b[1] - oz, b[0] + ox, y, b[1] + oz,
      a[0] - ox, y, a[1] - oz, b[0] + ox, y, b[1] + oz, a[0] + ox, y, a[1] + oz);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

/* ------------------------------------------------------------------ chão e luz */
async function chao() {
  const loader = new THREE.TextureLoader();
  const [tp, tc] = await Promise.all([loader.loadAsync('data/' + S.parque.tex), loader.loadAsync('data/' + S.entorno.tex)]);
  progresso(0.8);
  const aniso = renderer.capabilities.getMaxAnisotropy();
  for (const tx of [tp, tc]) { tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = Math.min(8, aniso); }
  const g = new THREE.Group();
  const plano = (box, mat, y, ro) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(box[2] - box[0], box[3] - box[1]), mat);
    m.rotation.x = -Math.PI / 2;
    const [cx, cz] = toWorld((box[0] + box[2]) / 2, (box[1] + box[3]) / 2);
    m.position.set(cx, y, cz); m.renderOrder = ro;
    g.add(m); return m;
  };
  plano([-40000, -40000, 40000, 40000], new THREE.MeshBasicMaterial({ color: COR_NEVOA, toneMapped: false, depthWrite: false }), -2, -3);
  ctxMat = holofote(new THREE.MeshBasicMaterial({ map: tc, toneMapped: false, depthWrite: false }));
  plano(S.entorno.box, ctxMat, -1, -2);
  parkMat = holofote(new THREE.MeshBasicMaterial({ map: tp, toneMapped: false }));
  plano(S.parque.box, parkMat, 0, -1);
  // sombra do sol: um plano que só desenha sombra, por cima do chão
  shadowCatcher = plano([-600, -600, W + 600, H + 600], new THREE.ShadowMaterial({ color: '#1f1a13', opacity: 0.5, depthWrite: false }), 0.06, 1);
  shadowCatcher.receiveShadow = true;
  // contorno do parque
  const ct = pairs(S.contorno).map((p) => toWorld(p[0], p[1]));
  const borda = new THREE.Mesh(fita(ct, 2.4, 0.1), new THREE.MeshBasicMaterial({ color: '#473315', transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  borda.renderOrder = 1; g.add(borda);
  return g;
}

const LAT = () => S.centro_latlon[0];
function dirSol(hora) {
  const d = new Date(), ini = new Date(d.getFullYear(), 0, 0), N = Math.floor((d - ini) / 864e5);
  const dec = THREE.MathUtils.degToRad(23.44) * Math.sin((2 * Math.PI * (284 + N)) / 365);
  const Hh = THREE.MathUtils.degToRad(15 * (hora - 12)), phi = THREE.MathUtils.degToRad(LAT());
  const E = -Math.cos(dec) * Math.sin(Hh);
  const Nn = Math.cos(phi) * Math.sin(dec) - Math.sin(phi) * Math.cos(dec) * Math.cos(Hh);
  const Up = Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(Hh);
  const sa = Math.sin(S.A), ca = Math.cos(S.A);
  return new THREE.Vector3(-E * sa + Nn * ca, Math.max(Up, 0.09), E * ca + Nn * sa).normalize();
}
let sunVec = new THREE.Vector3(0.3, 0.8, 0.4);
function setHora(h) {
  sunVec = dirSol(h);
  const el = sunVec.y;
  const quente = THREE.MathUtils.smoothstep(0.55, 0.12, el);
  sun.color.setRGB(1, 0.99 - 0.18 * quente, 0.97 - 0.38 * quente);
  sun.intensity = 1.55 + 0.75 * THREE.MathUtils.clamp(el / 0.6, 0, 1);
  hemi.intensity = 1.75 + 0.25 * THREE.MathUtils.clamp(el / 0.6, 0, 1);
  shadowCatcher.material.opacity = 0.4 + 0.14 * THREE.MathUtils.clamp(el / 0.6, 0, 1);
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  $('#tSunOut').textContent = `${hh}h${mm ? String(mm).padStart(2, '0') : ''}`;
  ajustaSombra(); invalidate();
}
function ajustaSombra() {
  const c = controls.target, d = camera.position.distanceTo(c);
  const R = THREE.MathUtils.clamp(d * 0.95, 240, 1500);
  sun.position.copy(c).addScaledVector(sunVec, 3000);
  sun.target.position.copy(c);
  const sc = sun.shadow.camera;
  sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = 1500; sc.far = 4800;
  sc.updateProjectionMatrix();
  sun.shadow.normalBias = (2 * R / sun.shadow.mapSize.x) * 1.4;
}

/* ------------------------------------------------------------------ câmera */
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
function esfera() {
  const off = new THREE.Vector3().subVectors(camera.position, controls.target);
  const s = new THREE.Spherical().setFromVector3(off);
  return { r: s.radius, phi: s.phi, theta: s.theta };
}
function voar(alvo, sph, dur = 1400) {
  if (REDUCED) dur = 1;
  const de = { t: controls.target.clone(), ...esfera() };
  let dt = sph.theta - de.theta;
  dt = ((dt + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  flight = { de, para: { t: alvo.clone(), r: sph.r, phi: sph.phi, theta: de.theta + dt }, t0: performance.now(), dur };
  invalidate();
}
function passoVoo(now) {
  const f = flight, k = ease(Math.min(1, (now - f.t0) / f.dur));
  const tg = f.de.t.clone().lerp(f.para.t, k);
  // arco: afasta um pouco no meio do caminho quando o deslocamento é grande
  const salto = Math.min(1.0, f.de.t.distanceTo(f.para.t) / 1500) * 0.35 * Math.sin(Math.PI * k);
  const r = THREE.MathUtils.lerp(f.de.r, f.para.r, k) * (1 + salto);
  const s = new THREE.Spherical(r, THREE.MathUtils.lerp(f.de.phi, f.para.phi, k), THREE.MathUtils.lerp(f.de.theta, f.para.theta, k));
  controls.target.copy(tg);
  camera.position.copy(tg).add(new THREE.Vector3().setFromSpherical(s));
  camera.lookAt(tg);
  if (k >= 1) flight = null;
}
/* Onde a área deve aparecer: no meio do espaço que sobra entre os painéis, não no meio da tela. */
function comCartao(A, sph) {
  let ox = 0, oy = 0;
  if (SMALL()) {
    const ch = Math.min(innerHeight * 0.66, 620), top = 56;
    oy = innerHeight / 2 - (top + innerHeight - ch) / 2;
  } else {
    const ixVisivel = innerWidth > 1180;
    const esq = ixVisivel ? 20 + 318 + 10 : 0, dir = innerWidth - (384 + 20 + 10);
    ox = (esq + dir) / 2 - innerWidth / 2;
  }
  const k = (2 * sph.r * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / innerHeight;
  const right = new THREE.Vector3(Math.cos(sph.theta), 0, -Math.sin(sph.theta));
  const fwd = new THREE.Vector3(-Math.sin(sph.theta), 0, -Math.cos(sph.theta));
  return A.clone().addScaledVector(right, -ox * k).addScaledVector(fwd, -oy * k / Math.max(0.35, Math.cos(sph.phi)));
}
function caber(largura, altura) {                // distância para caber um retângulo de chão na tela
  const vf = THREE.MathUtils.degToRad(camera.fov) / 2;
  return Math.max(altura / 2 / Math.tan(vf), largura / 2 / (Math.tan(vf) * camera.aspect));
}
function vistaGeral(dur) {
  const retrato = camera.aspect < 1;
  const livre = !SMALL() && innerWidth > 1000 ? (innerWidth - 350) / innerWidth : 1;   // o índice ocupa a esquerda
  const r = retrato ? caber(H * 1.12, W * 0.64) : caber(W * 0.98 / livre, H * 1.35);
  const fim = { r, phi: retrato ? 0.92 : 0.96, theta: retrato ? -Math.PI / 2 + 0.25 : -0.14 };
  let alvo = new THREE.Vector3(retrato ? -120 : 30, 0, retrato ? 0 : 60);
  if (livre < 1) {
    const k = (2 * r * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / innerHeight;
    alvo.addScaledVector(new THREE.Vector3(Math.cos(fim.theta), 0, -Math.sin(fim.theta)), -(350 / 2) * k);
  }
  voar(alvo, fim, dur);
}
function vistaCima() {
  const retrato = camera.aspect < 1;
  const livre = !SMALL() && innerWidth > 1000 ? (innerWidth - 350) / innerWidth : 1;
  const r = retrato ? caber(H * 1.1, W * 1.05) : caber(W * 1.06 / livre, H * 1.1);
  const alvo = new THREE.Vector3(0, 0, 0);
  if (livre < 1) alvo.x -= (350 / 2) * (2 * r * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / innerHeight;
  voar(alvo, { r, phi: 0.0001, theta: retrato ? -Math.PI / 2 : 0 });
}

/* ------------------------------------------------------------------ pinos */
const pinEls = [];
function montaPinos() {
  const box = $('#pins');
  box.innerHTML = '';
  pinEls.length = 0;
  AREAS.forEach((a, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pin3d';
    b.innerHTML = `<span class="pin3d__stem"></span><span class="pin3d__dot"></span><span class="pin3d__tag"><b>${String(i + 1).padStart(2, '0')}</b>${esc(tr(a.short))}</span>`;
    b.setAttribute('aria-label', tr(a.name));
    b.addEventListener('click', () => { pararTour(); escolheArea(i); });
    b.addEventListener('pointerenter', () => setHover(i));
    b.addEventListener('pointerleave', () => setHover(-1));
    box.appendChild(b);
    const [x, z] = pct(a.at);
    pinEls.push({ el: b, stem: b.firstChild, tag: b.lastChild, p: new THREE.Vector3(x, a.ph, z), g: new THREE.Vector3(x, 0, z), w: 0 });
  });
  requestAnimationFrame(() => pinEls.forEach((p) => { p.w = p.tag.offsetWidth; }));
}
const vtmp = new THREE.Vector3();
function posicionaPinos() {
  const w = innerWidth, h = innerHeight;
  const lista = [];
  for (const [i, p] of pinEls.entries()) {
    vtmp.copy(p.p).project(camera);
    if (vtmp.z > 1 || Math.abs(vtmp.x) > 1.3 || Math.abs(vtmp.y) > 1.3) { p.el.style.opacity = 0; p.el.style.pointerEvents = 'none'; continue; }
    const x = (vtmp.x + 1) / 2 * w, y = (1 - vtmp.y) / 2 * h;
    vtmp.copy(p.g).project(camera);
    const gy = (1 - vtmp.y) / 2 * h;
    lista.push({ i, p, x, y, gy, d: camera.position.distanceTo(p.g) });
  }
  const sel = selected?.kind === 'area' ? selected.i : -1;
  const pr = (i) => PRIORIDADE.indexOf(AREAS[i].id);
  lista.sort((a, b) => (b.i === sel) - (a.i === sel) || (b.i === hovered) - (a.i === hovered) || pr(a.i) - pr(b.i));
  const feitos = [];
  const topo = SMALL() ? 60 : 68;
  const bate = (r) => r[0] < 4 || r[2] > w - 4 || r[1] < topo || feitos.some((o) => r[0] < o[2] && r[2] > o[0] && r[1] < o[3] && r[3] > o[1]);
  for (const o of lista) {
    const { p, x, y } = o, w2 = p.w + 30;
    if (y < topo - 4) { p.el.style.opacity = 0; p.el.style.pointerEvents = 'none'; continue; }   // sob a barra de cima
    let lado = 'r', r = [x - 8, y - 13, x + w2, y + 13];
    if (bate(r)) { const r2 = [x - w2, y - 13, x + 8, y + 13]; if (!bate(r2)) { lado = 'l'; r = r2; } else { lado = 'm'; r = [x - 9, y - 9, x + 9, y + 9]; } }
    if (o.i === sel && lado === 'm') { lado = x > w / 2 ? 'l' : 'r'; }
    feitos.push(r);
    p.el.classList.toggle('is-left', lado === 'l');
    p.el.classList.toggle('is-mini', lado === 'm' && o.i !== sel);
    p.el.style.transform = `translate3d(${(lado === 'l' ? x - p.w - 21 + 6.5 : x - 6.5).toFixed(1)}px,${(y - 13).toFixed(1)}px,0)`;
    p.el.style.opacity = 1; p.el.style.pointerEvents = '';
    const hs = Math.max(0, o.gy - y);
    p.stem.style.height = hs.toFixed(1) + 'px';
  }
}

/* ------------------------------------------------------------------ seleção */
function setHover(i) {
  if (hovered === i) return;
  hovered = i; U.hov.value = i;
  pinEls.forEach((p, j) => p.el.classList.toggle('is-hover', j === i));
  document.querySelectorAll('.arealist button').forEach((b, j) => b.classList.toggle('is-hover', j === i));
  invalidate();
}
function marcaSelecao(i) {
  U.sel.value = i; mixTarget = i >= 0 ? 1 : 0;
  pinEls.forEach((p, j) => p.el.classList.toggle('is-sel', j === i));
  $('#pins').classList.toggle('has-sel', i >= 0);
  document.querySelectorAll('.arealist button').forEach((b, j) => b.setAttribute('aria-current', j === i ? 'true' : 'false'));
}
function focoArea(a) {
  const pts = a.poly.map(pct);
  const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2;
  const r = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)) * 0.55;
  return [cx, cz, r];
}
function escolheArea(i, voo = true) {
  const a = AREAS[i];
  selected = { kind: 'area', i };
  limpaLote();
  marcaSelecao(i);
  const [cx, cz, r] = focoArea(a);
  U.focus.value.set(cx, cz, Math.max(160, r), 1);
  if (voo) {
    const [x, z] = pct(a.at);
    const sph = esfera();
    const dist = a.dist * (camera.aspect < 1 ? 1.5 : 1) * (SMALL() ? 1.15 : 1);
    const fim = { r: dist, phi: THREE.MathUtils.clamp(sph.phi, 0.62, 0.98), theta: sph.theta };
    voar(comCartao(new THREE.Vector3(x, 0, z), fim), fim, 1500);
  }
  mostraCartaoArea(i);
  try { history.replaceState(null, '', '#' + a.id); } catch (e) { /* file:// */ }
  invalidate();
}
function escolheLote(l, voo = true) {
  const ia = areaIdx.industrial;
  selected = { kind: 'lot', lot: l, i: ia };
  marcaSelecao(-1);
  U.focus.value.set(0, 0, 1e5, 0);
  desenhaLote(l);
  const pts = pairs(l.p).map((p) => toWorld(p[0], p[1]));
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cz = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  U.focus.value.set(cx, cz, 170, 1);
  if (voo) {
    const sph = esfera();
    const fim = { r: camera.aspect < 1 ? 720 : 560, phi: THREE.MathUtils.clamp(sph.phi, 0.6, 0.95), theta: sph.theta };
    voar(comCartao(new THREE.Vector3(cx, 0, cz), fim), fim, 1300);
  }
  mostraCartaoLote(l);
  try { history.replaceState(null, '', '#lote-' + l.id); } catch (e) { /* file:// */ }
  invalidate();
}
function limpaSelecao() {
  selected = null;
  marcaSelecao(-1);
  limpaLote();
  U.focus.value.w = 0;
  fechaCartao();
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* file:// */ }
  invalidate();
}
function limpaLote() {
  lotLayer.children.forEach((m) => { m.geometry.dispose(); m.material.dispose(); });
  lotLayer.clear();
}
function desenhaLote(l, hover = false) {
  if (!hover) limpaLote();
  const pts = pairs(l.p).map((p) => toWorld(p[0], p[1]));
  const shape = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], -p[1])));
  const fill = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: '#cbb88f', transparent: true,
    opacity: hover ? 0.28 : 0.5, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  fill.rotation.x = -Math.PI / 2; fill.position.y = 0.2; fill.renderOrder = 1;
  const line = new THREE.Mesh(fita(pts, hover ? 1.6 : 2.6, 0.3), new THREE.MeshBasicMaterial({ color: '#473315', depthWrite: false, toneMapped: false,
    transparent: true, opacity: hover ? 0.6 : 0.95, side: THREE.DoubleSide }));
  line.renderOrder = 1;
  fill.userData.hover = line.userData.hover = hover;
  lotLayer.add(fill, line);
}

/* ------------------------------------------------------------------ cartão */
const card = $('#card');
function abreCartao() {
  card.hidden = false;
  document.body.classList.add('card-open');
  if (SMALL()) { $('#index').classList.remove('is-open'); document.body.classList.remove('index-open'); $('#tAreas').setAttribute('aria-expanded', 'false'); }
}
function fechaCartao() {
  card.hidden = true;
  document.body.classList.remove('card-open');
}
function fotos(lista) {
  const box = $('#cardMedia');
  box.innerHTML = '';
  if (!lista.length) return;
  const track = document.createElement('div'); track.className = 'slides';
  lista.forEach((f, i) => {
    const im = document.createElement('img');
    im.alt = `${t('card.photo')} ${i + 1}/${lista.length}`; im.decoding = 'async'; im.draggable = false;
    im.dataset.src = ASSETS + f;
    track.appendChild(im);
  });
  box.appendChild(track);
  let cur = 0;
  const ui = document.createElement('div'); ui.className = 'slides__ui';
  if (lista.length > 1) {
    ui.innerHTML = `<button type="button" aria-label="${esc(t('ui.prev'))}">‹</button><button type="button" aria-label="${esc(t('ui.next'))}">›</button><span class="slides__dots">${lista.map(() => '<i></i>').join('')}</span>`;
    box.appendChild(ui);
  }
  const dots = ui.querySelectorAll('i');
  const ir = (k) => {
    cur = (k + lista.length) % lista.length;
    track.style.transform = `translateX(${-cur * 100}%)`;
    [cur - 1, cur, cur + 1].forEach((j) => { const im = track.children[(j + lista.length) % lista.length]; if (im && !im.src) im.src = im.dataset.src; });
    dots.forEach((d, j) => d.classList.toggle('on', j === cur));
  };
  const [bp, bn] = ui.querySelectorAll('button');
  bp?.addEventListener('click', () => ir(cur - 1));
  bn?.addEventListener('click', () => ir(cur + 1));
  let x0 = null;
  track.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  track.addEventListener('pointerup', (e) => { if (x0 != null && Math.abs(e.clientX - x0) > 40) ir(cur + (e.clientX < x0 ? 1 : -1)); x0 = null; });
  ir(0);
}
function kpis(lista) {
  $('#cardKpis').innerHTML = lista.map((k) => {
    if (k.t) return `<div class="solo"><dd>${esc(tr(k.t))}</dd></div>`;
    const v = k.v ?? `${fmt(k.n)} ${tr(k.u)}`.trim();
    return `<div><dt>${esc(v)}</dt><dd>${esc(tr(k.l))}</dd></div>`;
  }).join('');
}
function mostraCartaoArea(i) {
  const a = AREAS[i];
  fotos(a.photos);
  $('#cardEyebrow').textContent = `${t('card.area')} ${String(i + 1).padStart(2, '0')} / ${AREAS.length}`;
  $('#cardTitle').textContent = tr(a.name);
  kpis(a.kpis);
  $('#cardText').textContent = tr(a.text);
  $('#cardNote').textContent = a.photos.length ? '' : t('card.nophoto');
  $('#cardActions').innerHTML = a.link ? `<a class="btn" href="${SITE}${a.link}">${esc(t('card.site'))} <span aria-hidden="true">→</span></a>` : '';
  $('#cardNav').hidden = false;
  $('#cardCount').textContent = `${i + 1} / ${AREAS.length}`;
  abreCartao();
  card.querySelector('.card__scroll').scrollTop = 0;
}
function nomeLote(l) {
  if (l.id === 'frente') return t('lot.front');
  if (l.id === 'borda') return t('lot.edge');
  return `${t('lot.title')} ${l.id.replace('-', ' · ')}`;
}
function mostraCartaoLote(l) {
  $('#cardMedia').innerHTML = '';
  $('#cardEyebrow').textContent = t('lot.eyebrow');
  $('#cardTitle').textContent = nomeLote(l);
  const lista = [{ n: l.a, u: 'm²', l: t('lot.area') }];
  if (l.a === 20000) lista.push({ v: '200 × 100 m', l: t('lot.std') });
  else if (l.id === 'frente') lista.push({ v: '433 × 50 m', l: t('lot.frontTxt') });
  else lista.push({ t: t('lot.irreg') });
  lista.push({ n: 1250, u: 'm²', l: t('lot.sale') });
  kpis(lista);
  const m = /^C(\d)-L(\d)$/.exec(l.id);
  $('#cardText').textContent = t('lot.text');
  $('#cardNote').textContent = m ? t('lot.grid').replace('{c}', m[1]).replace('{l}', m[2]) : '';
  $('#cardActions').innerHTML = `<a class="btn" href="${SITE}index.html#contato">${esc(t('card.contact'))} <span aria-hidden="true">→</span></a>` +
    `<button type="button" class="linkbtn" id="lotBack">${esc(t('lot.back'))}</button>`;
  $('#lotBack').addEventListener('click', () => escolheArea(areaIdx.industrial));
  $('#cardNav').hidden = true;
  abreCartao();
  card.querySelector('.card__scroll').scrollTop = 0;
}

/* ------------------------------------------------------------------ apontar e clicar */
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const chaoPlano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function aponta(cx, cy) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(pickables, false)[0];
  const p = new THREE.Vector3();
  if (hit) {
    const a = hit.object.geometry.attributes.aArea;
    const idx = hit.face ? hit.face.a : 0;
    return { area: Math.round(a.getX(idx)), point: hit.point, building: true };
  }
  if (!ray.ray.intersectPlane(chaoPlano, p)) return null;
  return { area: areaNoChao(p.x, p.z), point: p, building: false };
}
function areaNoChao(x, z) {
  const X = (x + W / 2) / W * 100, Y = (z + H / 2) / H * 100;
  for (const id of HIT_ORDER) if (inPoly(X, Y, AREAS[areaIdx[id]].poly)) return areaIdx[id];
  return -1;
}
function loteEm(p) {
  const X = p.x + W / 2, Y = p.z + H / 2;
  return S.lotes.find((l) => inPoly(X, Y, l._pts ||= pairs(l.p)));
}
function alvoEm(cx, cy) {
  const h = aponta(cx, cy);
  if (!h) return null;
  if (h.area === areaIdx.industrial || (!h.building && h.area !== -1)) {
    const l = loteEm(h.point);
    if (l) return { lot: l, point: h.point };
  }
  return h.area >= 0 ? { area: h.area, point: h.point } : { point: h.point };
}

const tip = $('#tip');
let lotHover = null;
function hoverEm(cx, cy) {
  const a = measure ? null : alvoEm(cx, cy);
  const stage = $('#stage');
  if (!a || (a.area == null && !a.lot)) {
    setHover(-1); tip.hidden = true; stage.classList.remove('is-point'); hoverLote(null); return;
  }
  stage.classList.add('is-point');
  if (a.lot) {
    setHover(-1); hoverLote(a.lot);
    tip.innerHTML = `<small>${esc(t('lot.eyebrow'))}</small><b>${esc(nomeLote(a.lot))}</b>${fmt(a.lot.a)} m²`;
  } else {
    hoverLote(null); setHover(a.area);
    tip.innerHTML = `<small>${String(a.area + 1).padStart(2, '0')} · ${esc(t('tip.open'))}</small><b>${esc(tr(AREAS[a.area].name))}</b>`;
  }
  tip.hidden = false;
  const tw = tip.offsetWidth;
  tip.style.transform = `translate(${Math.min(cx + 16, innerWidth - tw - 8)}px,${cy + 18}px)`;
}
function hoverLote(l) {
  if (lotHover === l) return;
  lotHover = l;
  lotLayer.children.filter((m) => m.userData.hover).forEach((m) => { lotLayer.remove(m); m.geometry.dispose(); m.material.dispose(); });
  if (l && !(selected?.kind === 'lot' && selected.lot === l)) desenhaLote(l, true);
  invalidate();
}

/* ------------------------------------------------------------------ medir */
let measureLine = null;
function modoMedir(on) {
  measure = on ? { pts: [] } : null;
  $('#tMeasure').setAttribute('aria-pressed', on ? 'true' : 'false');
  $('#stage').classList.toggle('is-measure', on);
  if (!on) { if (measureLine) scene.remove(measureLine); measureLine = null; $('#measure').hidden = true; }
  dica(on ? 'hint.measure' : null);
  invalidate();
}
function cliqueMedir(cx, cy) {
  const h = aponta(cx, cy);
  if (!h) return;
  const p = h.point.clone(); p.y = 0;
  if (measure.pts.length >= 2) measure.pts = [];
  measure.pts.push(p);
  if (measureLine) scene.remove(measureLine);
  const pts = measure.pts.length === 1 ? [p, p.clone().add(new THREE.Vector3(0.01, 0, 0))] : measure.pts;
  measureLine = new THREE.Group();
  const linha = new THREE.Mesh(fita(pts.map((v) => [v.x, v.z]), Math.max(1.2, camera.position.distanceTo(controls.target) / 450), 0.6, false),
    new THREE.MeshBasicMaterial({ color: '#473315', depthTest: false, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  linha.renderOrder = 5;
  const pontos = new THREE.Points(new THREE.BufferGeometry().setFromPoints(measure.pts.map((v) => v.clone().setY(0.8))),
    new THREE.PointsMaterial({ color: '#0e0d0b', size: 9, sizeAttenuation: false, depthTest: false, toneMapped: false }));
  pontos.renderOrder = 6;
  measureLine.add(linha, pontos);
  scene.add(measureLine);
  invalidate();
}
function posicionaMedida() {
  const el = $('#measure');
  if (!measure || measure.pts.length < 2) { el.hidden = true; return; }
  const [a, b] = measure.pts;
  vtmp.copy(a).add(b).multiplyScalar(0.5).project(camera);
  el.hidden = false;
  el.textContent = `${fmt(Math.round(a.distanceTo(b)))} m`;
  el.style.left = ((vtmp.x + 1) / 2 * innerWidth) + 'px';
  el.style.top = ((1 - vtmp.y) / 2 * innerHeight) + 'px';
}

/* ------------------------------------------------------------------ tour */
function iniciaTour() {
  tour = { i: selected?.kind === 'area' ? selected.i : -1, timer: 0 };
  $('#tTour').setAttribute('aria-pressed', 'true');
  dica('hint.tour');
  const passo = () => {
    if (!tour) return;
    tour.i = (tour.i + 1) % AREAS.length;
    escolheArea(tour.i);
    tour.timer = setTimeout(passo, 7000);
  };
  passo();
}
function pararTour() {
  if (!tour) return;
  clearTimeout(tour.timer); tour = null;
  $('#tTour').setAttribute('aria-pressed', 'false');
  dica(null);
}

/* ------------------------------------------------------------------ interface */
let hintTimer = 0;
function dica(chave, ms = 0) {
  const el = $('#hint');
  clearTimeout(hintTimer);
  if (!chave) { el.classList.add('is-off'); return; }
  el.textContent = t(chave); el.dataset.k = chave;
  el.classList.remove('is-off');
  if (ms) hintTimer = setTimeout(() => el.classList.add('is-off'), ms);
}
function aplicaIdioma() {
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  document.querySelectorAll('.facts dd').forEach((dd) => { dd.textContent = `${fmt(+dd.dataset.n)}${dd.dataset.u ? ' ' + dd.dataset.u : ''}`; });
  document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.lang === lang ? 'true' : 'false'));
  document.title = `${t('ui.title')} 3D — Bracerum Park`;
  $('#areaList').innerHTML = AREAS.map((a, i) => `<li><button type="button" data-i="${i}" aria-current="false"><b>${String(i + 1).padStart(2, '0')}</b><span>${esc(tr(a.name))}</span></button></li>`).join('');
  document.querySelectorAll('.arealist button').forEach((b) => {
    const i = +b.dataset.i;
    b.addEventListener('click', () => { pararTour(); escolheArea(i); });
    b.addEventListener('pointerenter', () => setHover(i));
    b.addEventListener('pointerleave', () => setHover(-1));
  });
  if (pinEls.length) montaPinos();
  if (selected?.kind === 'area') { marcaSelecao(selected.i); mostraCartaoArea(selected.i); }
  if (selected?.kind === 'lot') mostraCartaoLote(selected.lot);
  const k = $('#hint').dataset.k;
  if (k && !$('#hint').classList.contains('is-off')) $('#hint').textContent = t(k);
  invalidate();
}
function progresso(f) { $('#loaderBar').style.width = Math.round(f * 100) + '%'; }

function ligaInterface() {
  document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => {
    lang = b.dataset.lang;
    try { localStorage.setItem('bp-lang', lang); } catch (e) { /* sem storage */ }
    aplicaIdioma();
  }));
  document.querySelectorAll('[data-site]').forEach((a) => { a.href = SITE + a.dataset.site; });
  $('#cardClose').addEventListener('click', () => { pararTour(); limpaSelecao(); });
  $('#cardPrev').addEventListener('click', () => { pararTour(); escolheArea(((selected?.i ?? 0) - 1 + AREAS.length) % AREAS.length); });
  $('#cardNext').addEventListener('click', () => { pararTour(); escolheArea(((selected?.i ?? -1) + 1) % AREAS.length); });
  $('#indexToggle').addEventListener('click', (e) => {
    const on = e.currentTarget.getAttribute('aria-expanded') !== 'true';
    e.currentTarget.setAttribute('aria-expanded', on ? 'true' : 'false');
    $('#areaList').hidden = !on;
  });
  $('#tAreas').addEventListener('click', (e) => {
    const ix = $('#index'), on = !ix.classList.contains('is-open');
    ix.classList.toggle('is-open', on); document.body.classList.toggle('index-open', on);
    e.currentTarget.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (on) fechaCartao();
  });
  $('#index').addEventListener('click', (e) => {
    if (SMALL() && e.target.closest('.arealist button')) { $('#index').classList.remove('is-open'); document.body.classList.remove('index-open'); }
  });
  $('#tHome').addEventListener('click', () => { pararTour(); limpaSelecao(); vistaGeral(); });
  $('#tTop').addEventListener('click', () => { pararTour(); limpaSelecao(); vistaCima(); });
  $('#tRotate').addEventListener('click', (e) => {
    controls.autoRotate = !controls.autoRotate;
    e.currentTarget.setAttribute('aria-pressed', controls.autoRotate ? 'true' : 'false');
    invalidate();
  });
  $('#tTour').addEventListener('click', () => (tour ? pararTour() : (modoMedir(false), iniciaTour())));
  $('#tMeasure').addEventListener('click', () => { pararTour(); modoMedir(!measure); });
  $('#tLabels').addEventListener('click', (e) => {
    const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
    e.currentTarget.setAttribute('aria-pressed', on ? 'true' : 'false');
    $('#pins').classList.toggle('is-off', !on);
  });
  $('#tSun').addEventListener('input', (e) => setHora(+e.target.value));
  const full = $('#tFull');
  if (!document.documentElement.requestFullscreen) full.hidden = true;
  full.addEventListener('click', () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {})));
  document.addEventListener('fullscreenchange', () => full.setAttribute('aria-pressed', document.fullscreenElement ? 'true' : 'false'));
  $('#compass').addEventListener('click', () => {
    const n = S.north, sph = esfera();
    voar(controls.target.clone(), { r: sph.r, phi: sph.phi, theta: Math.atan2(-n[0], -n[1]) }, 900);
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (measure) modoMedir(false); else { pararTour(); limpaSelecao(); } }
  });

  // clique (sem arrasto) vs. arrasto da câmera
  const el = renderer.domElement;
  let down = null;
  el.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
    pararTour();
    if (!measure) dica(null);
  });
  el.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t;
    down = null;
    if (moved > 6 || dt > 700) return;
    if (measure) { cliqueMedir(e.clientX, e.clientY); return; }
    const a = alvoEm(e.clientX, e.clientY);
    if (a?.lot) escolheLote(a.lot);
    else if (a?.area != null) escolheArea(a.area);
    else limpaSelecao();
    tip.hidden = true;
  });
  let pend = null;
  el.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (e.buttons) { tip.hidden = true; return; }
    if (!pend) requestAnimationFrame(() => { hoverEm(pend.x, pend.y); pend = null; });
    pend = { x: e.clientX, y: e.clientY };
  });
  el.addEventListener('pointerleave', () => { tip.hidden = true; setHover(-1); hoverLote(null); });
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.fov = camera.aspect < 1 ? 46 : 38;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    invalidate();
  });
}

/* ------------------------------------------------------------------ bússola */
function bussola() {
  const n = S.north, s = esfera();
  const up = -(n[0] * Math.sin(s.theta) + n[1] * Math.cos(s.theta));
  const right = n[0] * Math.cos(s.theta) - n[1] * Math.sin(s.theta);
  const ang = Math.atan2(right, up) * 180 / Math.PI;
  $('#compassNeedle').setAttribute('transform', `rotate(${ang.toFixed(1)} 24 24)`);
  const rad = ang * Math.PI / 180;
  const N = $('#compassN');
  N.setAttribute('x', (24 + Math.sin(rad) * 17.5).toFixed(2));
  N.setAttribute('y', (24 - Math.cos(rad) * 17.5 + 2.9).toFixed(2));
}

/* ------------------------------------------------------------------ laço */
function laco(now) {
  requestAnimationFrame(laco);
  if (flight) {
    passoVoo(now);
    dirty = true;
  }
  if (controls.update()) dirty = true;
  if (controls.autoRotate) dirty = true;
  const m = U.mix.value;
  if (Math.abs(m - mixTarget) > 0.002) { U.mix.value += (mixTarget - m) * 0.14; dirty = true; } else U.mix.value = mixTarget;
  if (!dirty) return;
  dirty = false;
  const d = camera.position.distanceTo(controls.target);
  scene.fog.near = d * 1.4 + 800;
  scene.fog.far = d * 6 + 9000;
  camera.near = Math.max(1.5, d / 400);
  camera.far = 60000;
  camera.updateProjectionMatrix();
  ajustaSombra();
  renderer.render(scene, camera);
  posicionaPinos();
  posicionaMedida();
  bussola();
}

/* ------------------------------------------------------------------ início */
function temWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}
async function iniciar() {
  aplicaIdioma();
  if (!temWebGL()) { $('#loader').classList.add('is-done'); $('#fallback').hidden = false; return; }
  progresso(0.1);
  S = await (await fetch('data/scene.json')).json();
  [W, H] = S.sheet;
  progresso(0.35);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, COARSE ? 1.6 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = !LOW;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  $('#stage').appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(COR_NEVOA, 4000, 20000);
  camera = new THREE.PerspectiveCamera(innerWidth < innerHeight ? 46 : 38, innerWidth / innerHeight, 2, 60000);

  hemi = new THREE.HemisphereLight('#f5f6f7', '#d4cfc4', 1.9);
  scene.add(hemi);
  sun = new THREE.DirectionalLight('#fffaf3', 2.2);
  sun.castShadow = !LOW;
  sun.shadow.mapSize.set(COARSE ? 2048 : 4096, COARSE ? 2048 : 4096);
  sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.075;
  controls.screenSpacePanning = false;
  controls.minDistance = 70; controls.maxDistance = 9000;
  controls.maxPolarAngle = THREE.MathUtils.degToRad(84);
  controls.zoomToCursor = true;
  controls.rotateSpeed = 0.55;
  controls.autoRotateSpeed = 0.5;
  controls.listenToKeyEvents(window);
  controls.addEventListener('change', invalidate);
  controls.addEventListener('start', () => { flight = null; });
  const lim = new THREE.Vector3(W / 2 + 900, 0, H / 2 + 900);
  controls.addEventListener('change', () => {
    const tg = controls.target;
    const cx = THREE.MathUtils.clamp(tg.x, -lim.x, lim.x), cz = THREE.MathUtils.clamp(tg.z, -lim.z, lim.z);
    if (cx !== tg.x || cz !== tg.z || tg.y !== 0) {
      const dx = cx - tg.x, dz = cz - tg.z, dy = -tg.y;
      tg.set(cx, 0, cz); camera.position.x += dx; camera.position.z += dz; camera.position.y += dy;
    }
  });

  scene.add(await chao());
  scene.add(volumes());
  scene.add(casca());
  scene.add(arvores());
  scene.add(lotLayer);
  progresso(0.95);

  setHora(+$('#tSun').value);
  montaPinos();
  ligaInterface();

  // começa alto e chega na vista geral
  camera.position.set(-2600, 5200, 6400);
  controls.target.set(0, 0, 0);
  camera.lookAt(0, 0, 0);
  controls.update();
  requestAnimationFrame(laco);
  progresso(1);
  setTimeout(() => {
    $('#loader').classList.add('is-done');
    const h = decodeURIComponent(location.hash.slice(1));
    const lote = h.startsWith('lote-') && S.lotes.find((l) => l.id === h.slice(5));
    if (lote) { vistaGeral(1); escolheLote(lote); }
    else if (areaIdx[h] != null) { vistaGeral(1); escolheArea(areaIdx[h]); }
    else { vistaGeral(2600); dica(COARSE ? 'hint.touch' : 'hint.desk', 9000); }
  }, 250);
  window.__bp = { scene, camera, controls, renderer, escolheArea, escolheLote, vistaGeral, vistaCima, setHora, S, U };
}

iniciar().catch((err) => {
  console.error(err);
  $('#loader').classList.add('is-done');
  $('#fallback').hidden = false;
});
