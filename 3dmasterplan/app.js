/* Masterplan 3D — Bracerum Park
   Maquete interativa do Masterplan V14 (28/10/2026). Os dados vêm de data/scene.json e data/lotes.json,
   gerados por docs/3dmasterplan/build_data.py e build_lotes.py — posições, contornos, lotes e metragens
   saem da planta; as alturas são estimativas (o V14 não define altura de nada).

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
    'ui.version': 'Masterplan V14 · 28/10/2026', 'ui.back': 'Voltar ao site', 'ui.h1a': 'A cidade industrial', 'ui.h1b': 'em volume',
    'f.area': 'área total', 'f.front': 'de frente para a PY-19', 'f.lots': 'lotes à venda', 'f.runway': 'pista de pouso',
    'ui.areas': 'Conheça o Bracerum Park',
    'ui.note': 'Maquete ilustrativa do Masterplan V14 (28/10/2026): posições, lotes e metragens da planta; categorias e preços da Política Comercial P1 (Tabela v3.1). Alturas e arquitetura são estimativas — o projeto não define altura dos prédios.',
    'ui.close': 'Fechar', 'ui.prev': 'Anterior', 'ui.next': 'Próxima', 'ui.toolsAria': 'Ferramentas da maquete',
    'ui.north': 'Norte para cima', 'ui.credit': 'Masterplan V14 (28/10/2026) · preços: Tabela P1 v3.1 · alturas estimadas · entorno', 'ui.stage': 'Maquete 3D do Bracerum Park',
    't.areas': 'Pontos', 't.home': 'Vista geral', 't.top': 'De cima', 't.rotate': 'Girar', 't.tour': 'Tour', 't.measure': 'Medir',
    't.labels': 'Rótulos', 't.sun': 'Hora do sol', 't.full': 'Tela cheia',
    'hint.desk': 'Arraste para girar · botão direito para mover · role para aproximar · clique num ponto ou num lote',
    'hint.touch': 'Um dedo gira · dois dedos movem e aproximam · toque num ponto ou num lote',
    'hint.measure': 'Clique em dois pontos do chão para medir · Esc para sair',
    'hint.tour': 'Tour pelos pontos do mapa · toque na maquete para parar',
    'card.area': 'Ponto', 'card.site': 'Ver no site', 'card.contact': 'Falar com a equipe comercial',
    'card.nophoto': 'Ainda não há imagens desta área — o volume é uma estimativa a partir da planta.',
    'card.photo': 'Foto', 'tip.open': 'clique para ver',
    't.lots': 'Lotes à venda',
    'lots.eyebrow': 'Política Comercial P1 · Tabela {v}', 'lots.title': 'Lotes à venda', 'lots.sub': '{n} lotes · {a} m² · Masterplan V14 (28/10/2026)',
    'lots.window': 'Janela de preço', 'lots.pay': 'Pagamento', 'lots.legendHead': 'Preço por m² · 1 a 8 lotes · 20% + 12x', 'lots.lots': 'lotes',
    'lots.recinto': 'Q37 · recinto alfandegado, fora da oferta', 'lots.see': 'Ver lotes e preços',
    'lots.howto': 'Clique num lote para ver o valor. Shift + clique soma lotes à simulação; o preço por m² cai a partir de 9 lotes.',
    'lots.howtoTouch': 'Toque num lote para ver o valor. Para somar lotes, use “Somar lotes” no cartão.',
    'lot.eyebrow': 'Lote industrial · Quadra {q}', 'lot.quadra': 'Quadra {q}', 'lot.multiEyebrow': 'Simulação · quadras {q}', 'lot.multiTitle': '{n} lotes · {a} m²',
    'lot.area': 'área de contrato, do nome oficial do lote ({cod})', 'lot.areaApprox': 'área aproximada, medida no mapa de lotes',
    'lot.cat': 'categoria · fator ×{f} sobre o preço Padrão', 'lot.total': 'Valor do lote', 'lot.totalOp': 'Total da operação',
    'lot.m2': '{p}/m² × {a} m²', 'lot.m2avg': 'média de {p}/m² × {a} m²', 'lot.down': 'Sinal de 20% na assinatura', 'lot.inst': '{n} parcelas mensais de',
    'lot.cash': 'Pagamento único na assinatura', 'lot.tier': 'Faixa de {de} a {ate} lotes na operação.', 'lot.tierUp': 'Faixa de {de} lotes ou mais na operação.',
    'lot.next': 'A partir de {n} lotes, {c} cai para {p}/m².', 'lot.add': 'Somar lotes', 'lot.adding': 'Somando: clique nos lotes para incluir ou tirar',
    'lot.block': 'Quadra {q} inteira ({n} lotes)', 'lot.clear': 'Limpar', 'lot.remove': 'Tirar {id} da simulação', 'lot.propose': 'Pedir proposta',
    'lot.notes': 'Valor = preço por m² × área do lote, em dólares, IVA não incluído. Vale a tabela vigente na data da assinatura; a disponibilidade de cada lote é confirmada pela Bracerum na proposta.',
    'lot.expoNote': 'Preço de lançamento para reservas assinadas até 13/11/2026, dentro da cota de 64 lotes.',
    'lot.approxNote': 'Lote de formato irregular: a área foi medida no mapa de lotes e pode diferir alguns m² da área de contrato, que vem no nome oficial do lote.',
    'lot.approxNoteN': 'Há {n} lote(s) de formato irregular: área medida no mapa de lotes, pode diferir alguns m² da área de contrato.',
    'q.recinto': 'Recinto alfandegado', 'lot.esquina': 'lote de esquina', 'lot.meio': 'meio de quadra', 'lot.retangular': 'retangular', 'lot.poligonal': 'poligonal', 'lot.frente': 'frente {f}', 'lot.frentes': 'frentes {f}', 'lot.e': ' e ', 'dir.N': 'norte', 'dir.S': 'sul', 'dir.L': 'leste', 'dir.O': 'oeste', 'lot.nomeOficial': 'Nome no masterplan: {n}', 'q.recintoArea': 'área da quadra Q37', 'q.fora': 'fora da oferta de lotes',
    'q.recintoTxt': 'A quadra Q37, junto ao Aeroporto de Cargas, é o recinto alfandegado do parque e não integra a oferta de lotes.',
    'mail.subject': 'Proposta Bracerum Park — {l}', 'mail.hello': 'Olá, gostaria de receber uma proposta para:',
    'mail.sim': 'Simulação no Masterplan 3D (Tabela {v}):', 'mail.parc': 'sinal {s} + {n} × {p}', 'measure.label': 'Medida',
  },
  en: {
    'ui.loading': 'Building the model…', 'ui.eyebrow': 'Bracerum Park · Villeta, Paraguay',
    'ui.noWebgl': 'This browser could not open the 3D model.',
    'ui.noWebglText': 'The viewer needs WebGL. Try another browser or a computer — meanwhile, the image shows the master plan.',
    'ui.toSiteMp': 'See the master plan on the site', 'ui.backAria': 'Bracerum Park — back to the site', 'ui.title': 'Master plan',
    'ui.version': 'Master plan V14 · 2026-10-28', 'ui.back': 'Back to the site', 'ui.h1a': 'The industrial city', 'ui.h1b': 'in three dimensions',
    'f.area': 'total area', 'f.front': 'of frontage on the PY-19', 'f.lots': 'lots for sale', 'f.runway': 'airstrip',
    'ui.areas': 'Discover Bracerum Park',
    'ui.note': 'Illustrative model of Master plan V14 (2026-10-28): positions, lots and areas from the plan; categories and prices from Commercial Policy P1 (price list v3.1). Heights and architecture are estimates — the project does not define building heights.',
    'ui.close': 'Close', 'ui.prev': 'Previous', 'ui.next': 'Next', 'ui.toolsAria': 'Model tools',
    'ui.north': 'North up', 'ui.credit': 'Master plan V14 (2026-10-28) · prices: P1 price list v3.1 · estimated heights · surroundings', 'ui.stage': 'Bracerum Park 3D model',
    't.areas': 'Points', 't.home': 'Overview', 't.top': 'Top view', 't.rotate': 'Rotate', 't.tour': 'Tour', 't.measure': 'Measure',
    't.labels': 'Labels', 't.sun': 'Time of day', 't.full': 'Full screen',
    'hint.desk': 'Drag to rotate · right button to pan · scroll to zoom · click a point or a lot',
    'hint.touch': 'One finger rotates · two fingers pan and zoom · tap a point or a lot',
    'hint.measure': 'Click two points on the ground to measure · Esc to exit',
    'hint.tour': 'Tour of the map points · tap the model to stop',
    'card.area': 'Point', 'card.site': 'See on the site', 'card.contact': 'Talk to the sales team',
    'card.nophoto': 'No images of this area yet — the volume is an estimate based on the plan.',
    'card.photo': 'Photo', 'tip.open': 'click to open',
    't.lots': 'Lots for sale',
    'lots.eyebrow': 'Commercial Policy P1 · Price list {v}', 'lots.title': 'Lots for sale', 'lots.sub': '{n} lots · {a} m² · Master plan V14 (2026-10-28)',
    'lots.window': 'Price window', 'lots.pay': 'Payment', 'lots.legendHead': 'Price per m² · 1 to 8 lots · 20% + 12x', 'lots.lots': 'lots',
    'lots.recinto': 'Q37 · customs bonded area, not for sale', 'lots.see': 'See lots and prices',
    'lots.howto': 'Click a lot to see its price. Shift + click adds lots to the quote; the price per m² drops from 9 lots up.',
    'lots.howtoTouch': 'Tap a lot to see its price. To add lots, use “Add lots” on the card.',
    'lot.eyebrow': 'Industrial lot · Block {q}', 'lot.quadra': 'Block {q}', 'lot.multiEyebrow': 'Quote · blocks {q}', 'lot.multiTitle': '{n} lots · {a} m²',
    'lot.area': 'contract area, from the lot’s official name ({cod})', 'lot.areaApprox': 'approximate area, measured on the lot map',
    'lot.cat': 'category · ×{f} on the Standard price', 'lot.total': 'Lot price', 'lot.totalOp': 'Total for the deal',
    'lot.m2': '{p}/m² × {a} m²', 'lot.m2avg': 'average {p}/m² × {a} m²', 'lot.down': '20% down payment on signing', 'lot.inst': '{n} monthly instalments of',
    'lot.cash': 'Single payment on signing', 'lot.tier': 'Bracket of {de} to {ate} lots in the deal.', 'lot.tierUp': 'Bracket of {de} lots or more in the deal.',
    'lot.next': 'From {n} lots, {c} drops to {p}/m².', 'lot.add': 'Add lots', 'lot.adding': 'Adding: click lots to include or remove them',
    'lot.block': 'Whole block {q} ({n} lots)', 'lot.clear': 'Clear', 'lot.remove': 'Remove {id} from the quote', 'lot.propose': 'Request a proposal',
    'lot.notes': 'Price = price per m² × lot area, in US dollars, VAT not included. The price list in force on the signing date applies; Bracerum confirms each lot’s availability in the proposal.',
    'lot.expoNote': 'Launch price for reservations signed by 13 Nov 2026, within the quota of 64 lots.',
    'lot.approxNote': 'Irregular lot: the area was measured on the lot map and may differ by a few m² from the contract area, which is part of the lot’s official name.',
    'lot.approxNoteN': '{n} irregular lot(s): area measured on the lot map, may differ by a few m² from the contract area.',
    'q.recinto': 'Customs bonded area', 'lot.esquina': 'corner lot', 'lot.meio': 'mid-block', 'lot.retangular': 'rectangular', 'lot.poligonal': 'polygonal', 'lot.frente': 'faces {f}', 'lot.frentes': 'faces {f}', 'lot.e': ' and ', 'dir.N': 'north', 'dir.S': 'south', 'dir.L': 'east', 'dir.O': 'west', 'lot.nomeOficial': 'Name in the master plan: {n}', 'q.recintoArea': 'area of block Q37', 'q.fora': 'not part of the lots for sale',
    'q.recintoTxt': 'Block Q37, next to the Cargo Airport, is the park’s customs bonded area and is not part of the lots for sale.',
    'mail.subject': 'Bracerum Park proposal — {l}', 'mail.hello': 'Hello, I would like a proposal for:',
    'mail.sim': 'Quote from the 3D Master plan (price list {v}):', 'mail.parc': '{s} down + {n} × {p}', 'measure.label': 'Distance',
  },
  es: {
    'ui.loading': 'Armando la maqueta…', 'ui.eyebrow': 'Bracerum Park · Villeta, Paraguay',
    'ui.noWebgl': 'Este navegador no abrió la maqueta 3D.',
    'ui.noWebglText': 'La visualización necesita WebGL. Pruebe otro navegador o una computadora — mientras tanto, la imagen muestra el masterplan.',
    'ui.toSiteMp': 'Ver el masterplan en el sitio', 'ui.backAria': 'Bracerum Park — volver al sitio', 'ui.title': 'Masterplan',
    'ui.version': 'Masterplan V14 · 28/10/2026', 'ui.back': 'Volver al sitio', 'ui.h1a': 'La ciudad industrial', 'ui.h1b': 'en volumen',
    'f.area': 'superficie total', 'f.front': 'de frente sobre la PY-19', 'f.lots': 'lotes en venta', 'f.runway': 'pista de aterrizaje',
    'ui.areas': 'Conozca Bracerum Park',
    'ui.note': 'Maqueta ilustrativa del Masterplan V14 (28/10/2026): posiciones, lotes y superficies del plano; categorías y precios de la Política Comercial P1 (lista v3.1). Alturas y arquitectura son estimaciones — el proyecto no define la altura de los edificios.',
    'ui.close': 'Cerrar', 'ui.prev': 'Anterior', 'ui.next': 'Siguiente', 'ui.toolsAria': 'Herramientas de la maqueta',
    'ui.north': 'Norte arriba', 'ui.credit': 'Masterplan V14 (28/10/2026) · precios: lista P1 v3.1 · alturas estimadas · entorno', 'ui.stage': 'Maqueta 3D de Bracerum Park',
    't.areas': 'Puntos', 't.home': 'Vista general', 't.top': 'Desde arriba', 't.rotate': 'Girar', 't.tour': 'Recorrido', 't.measure': 'Medir',
    't.labels': 'Rótulos', 't.sun': 'Hora del sol', 't.full': 'Pantalla completa',
    'hint.desk': 'Arrastre para girar · botón derecho para mover · rueda para acercar · haga clic en un punto o un lote',
    'hint.touch': 'Un dedo gira · dos dedos mueven y acercan · toque un punto o un lote',
    'hint.measure': 'Haga clic en dos puntos del suelo para medir · Esc para salir',
    'hint.tour': 'Recorrido por los puntos del mapa · toque la maqueta para detener',
    'card.area': 'Punto', 'card.site': 'Ver en el sitio', 'card.contact': 'Hablar con el equipo comercial',
    'card.nophoto': 'Todavía no hay imágenes de esta área — el volumen es una estimación a partir del plano.',
    'card.photo': 'Foto', 'tip.open': 'clic para ver',
    't.lots': 'Lotes en venta',
    'lots.eyebrow': 'Política Comercial P1 · Lista {v}', 'lots.title': 'Lotes en venta', 'lots.sub': '{n} lotes · {a} m² · Masterplan V14 (28/10/2026)',
    'lots.window': 'Ventana de precio', 'lots.pay': 'Pago', 'lots.legendHead': 'Precio por m² · 1 a 8 lotes · 20% + 12x', 'lots.lots': 'lotes',
    'lots.recinto': 'Q37 · recinto aduanero, fuera de la oferta', 'lots.see': 'Ver lotes y precios',
    'lots.howto': 'Haga clic en un lote para ver el valor. Shift + clic suma lotes a la simulación; el precio por m² baja desde 9 lotes.',
    'lots.howtoTouch': 'Toque un lote para ver el valor. Para sumar lotes, use “Sumar lotes” en la tarjeta.',
    'lot.eyebrow': 'Lote industrial · Manzana {q}', 'lot.quadra': 'Manzana {q}', 'lot.multiEyebrow': 'Simulación · manzanas {q}', 'lot.multiTitle': '{n} lotes · {a} m²',
    'lot.area': 'superficie de contrato, del nombre oficial del lote ({cod})', 'lot.areaApprox': 'superficie aproximada, medida en el mapa de lotes',
    'lot.cat': 'categoría · factor ×{f} sobre el precio Estándar', 'lot.total': 'Valor del lote', 'lot.totalOp': 'Total de la operación',
    'lot.m2': '{p}/m² × {a} m²', 'lot.m2avg': 'promedio de {p}/m² × {a} m²', 'lot.down': 'Seña del 20% a la firma', 'lot.inst': '{n} cuotas mensuales de',
    'lot.cash': 'Pago único a la firma', 'lot.tier': 'Franja de {de} a {ate} lotes en la operación.', 'lot.tierUp': 'Franja de {de} lotes o más en la operación.',
    'lot.next': 'Desde {n} lotes, {c} baja a {p}/m².', 'lot.add': 'Sumar lotes', 'lot.adding': 'Sumando: haga clic en los lotes para incluir o quitar',
    'lot.block': 'Manzana {q} entera ({n} lotes)', 'lot.clear': 'Limpiar', 'lot.remove': 'Quitar {id} de la simulación', 'lot.propose': 'Pedir propuesta',
    'lot.notes': 'Valor = precio por m² × superficie del lote, en dólares, IVA no incluido. Vale la lista vigente a la fecha de la firma; Bracerum confirma la disponibilidad de cada lote en la propuesta.',
    'lot.expoNote': 'Precio de lanzamiento para reservas firmadas hasta el 13/11/2026, dentro del cupo de 64 lotes.',
    'lot.approxNote': 'Lote de forma irregular: la superficie se midió en el mapa de lotes y puede diferir algunos m² de la superficie de contrato, que figura en el nombre oficial del lote.',
    'lot.approxNoteN': 'Hay {n} lote(s) de forma irregular: superficie medida en el mapa de lotes, puede diferir algunos m² de la de contrato.',
    'q.recinto': 'Recinto aduanero', 'lot.esquina': 'lote de esquina', 'lot.meio': 'medio de manzana', 'lot.retangular': 'rectangular', 'lot.poligonal': 'poligonal', 'lot.frente': 'frente {f}', 'lot.frentes': 'frentes {f}', 'lot.e': ' y ', 'dir.N': 'norte', 'dir.S': 'sur', 'dir.L': 'este', 'dir.O': 'oeste', 'lot.nomeOficial': 'Nombre en el masterplan: {n}', 'q.recintoArea': 'superficie de la manzana Q37', 'q.fora': 'fuera de la oferta de lotes',
    'q.recintoTxt': 'La manzana Q37, junto al Aeropuerto de Cargas, es el recinto aduanero del parque y no integra la oferta de lotes.',
    'mail.subject': 'Propuesta Bracerum Park — {l}', 'mail.hello': 'Hola, quisiera recibir una propuesta para:',
    'mail.sim': 'Simulación en el Masterplan 3D (lista {v}):', 'mail.parc': 'seña {s} + {n} × {p}', 'measure.label': 'Medida',
  },
};

/* Os pontos do mapa: os 21 da legenda do folheto do cliente ("Conheça o BracerumPark", 2026-10-20),
   na ordem e com os nomes dele, mais dois que o Masterplan V14 (28/10/2026) trouxe e a legenda não
   tem (22 Bracerum Club, 23 Refeitório/Grêmio/Hub). Posições e números do V14. Polígono e âncora em %
   da prancha (x da esquerda, y do topo), altura do pino (m), distância da câmera ao chegar. */
const AREAS = [
  { id: 'entrada', poly: [[39.2, 3.2], [48.9, 3.2], [48.9, 9.4], [39.2, 9.4]], at: [42.3, 6.0], ph: 34, dist: 520,
    name: { pt: 'Entrada Parque', en: 'Park entrance', es: 'Entrada del Parque' },
    kpis: [
      { n: 2100, u: 'm', l: { pt: 'de frente para a PY-19', en: 'of frontage on the PY-19', es: 'de frente sobre la PY-19' } },
      { n: 13, u: 'm', l: { pt: 'Via Costeira, a via paralela que distribui o acesso', en: 'Via Costeira, the parallel road that distributes access', es: 'Vía Costera, la calle paralela que distribuye el acceso' } }],
    text: { pt: 'O acesso pela PY-19 fica no meio da frente do parque: a alça sai da rodovia, faz o retorno e entra na Via Costeira, uma via paralela de 13 m — o caminhão não para na rodovia.',
      en: 'Access from the PY-19 sits in the middle of the park’s frontage: the loop leaves the highway, turns back and joins the Via Costeira, a 13 m parallel road — trucks never stop on the highway.',
      es: 'El acceso por la PY-19 está en el medio del frente del parque: el lazo sale de la ruta, hace el retorno y entra en la Vía Costera, una calle paralela de 13 m — el camión no se detiene en la ruta.' },
    photos: ['web/fotos/park-aereo-rio.jpg', 'web/fotos/vias-rotatoria.jpg'] },
  { id: 'posto', poly: [[39.2, 9.4], [43.6, 9.4], [43.6, 20.3], [39.2, 20.3]], at: [41.6, 16.2], ph: 30, dist: 380,
    name: { pt: 'Posto de Gasolina', en: 'Fuel station', es: 'Estación de servicio' },
    kpis: [
      { n: 3355, u: 'm²', l: { pt: 'posto, salão, restaurante e Clube do Caminhoneiro', en: 'fuel station, hall, restaurant and Truckers’ Club', es: 'estación de servicio, salón, restaurante y Club del Camionero' } }],
    text: { pt: 'O posto em L, com salão e restaurante, fica no lado esquerdo do pátio de caminhões, na entrada — atende quem chega pela PY-19 e quem trabalha no parque.',
      en: 'The L-shaped fuel station, with a hall and restaurant, sits on the left side of the truck yard, at the entrance — serving those arriving from the PY-19 and those who work in the park.',
      es: 'La estación de servicio en L, con salón y restaurante, está en el lado izquierdo del patio de camiones, en la entrada — atiende a quien llega por la PY-19 y a quien trabaja en el parque.' },
    photos: ['park/select-posto-cobertura.jpg', 'web/fotos/posto-caminhoes.jpg', 'park/select-posto-noturno.jpg'], link: 'select.html' },
  { id: 'clube', poly: [[43.6, 9.4], [47.4, 9.4], [47.4, 20.3], [43.6, 20.3]], at: [45.6, 12.4], ph: 30, dist: 440,
    name: { pt: 'Clube do Caminhoneiro', en: 'Truckers’ Club', es: 'Club del Camionero' },
    kpis: [
      { t: { pt: 'pátio de caminhões com rotatória, vagas em espinha de peixe e quadra', en: 'truck yard with a roundabout, herringbone bays and a sports court', es: 'patio de camiones con rotonda, estacionamiento en espiga y cancha' } }],
    text: { pt: 'O caminhão espera fora da área industrial, com estrutura para o motorista, e entra pelo Gate quando é chamado.',
      en: 'Trucks wait outside the industrial area, with facilities for the driver, and go through the gate when called.',
      es: 'El camión espera fuera del área industrial, con estructura para el conductor, y entra por el portón cuando lo llaman.' },
    photos: ['park/select-apoio-caminhoes.jpg', 'park/vias-caminhoes.jpg'], link: 'select.html' },
  { id: 'portaria', poly: [[47.4, 9.4], [48.9, 9.4], [48.9, 20.3], [47.4, 20.3]], at: [48.2, 17.6], ph: 30, dist: 340,
    name: { pt: 'Portaria', en: 'Gatehouse', es: 'Portería' },
    kpis: [
      { n: 1210, u: 'm²', l: { pt: 'Gate / acesso à indústria', en: 'gate / industrial access', es: 'portón / acceso a la industria' } }],
    text: { pt: 'Dois gates controlam a área industrial: o Gate-1 abre direto no boulevard central, que atravessa o parque até a pista; o Gate-2 fica do outro lado do pátio, junto ao posto.',
      en: 'Two gates control the industrial area: Gate-1 opens straight onto the central boulevard, which crosses the park to the runway; Gate-2 is on the other side of the yard, by the fuel station.',
      es: 'Dos portones controlan el área industrial: el Gate-1 abre directo al bulevar central, que atraviesa el parque hasta la pista; el Gate-2 está del otro lado del patio, junto a la estación de servicio.' },
    photos: ['web/fotos/portaria.jpg'] },
  { id: 'outlet', poly: [[48.9, 8.8], [69.6, 8.8], [69.6, 15.9], [48.9, 15.9]], at: [57.6, 12.6], ph: 32, dist: 800,
    name: { pt: 'Bracerum Outlet', en: 'Bracerum Outlet', es: 'Bracerum Outlet' },
    kpis: [
      { n: 61850, u: 'm²', l: { pt: 'Bracerum Outlet, em L na frente da rodovia', en: 'L-shaped Bracerum Outlet facing the highway', es: 'Bracerum Outlet en L frente a la ruta' } },
      { n: 433, u: 'm', l: { pt: 'de frente para a Via Costeira', en: 'of frontage on the Via Costeira', es: 'de frente sobre la Vía Costera' } }],
    text: { pt: 'Comércio na frente da PY-19, ao lado da entrada, com vitrine para quem passa na rodovia. A arquitetura ainda não foi definida — os volumes são ilustrativos.',
      en: 'Retail on the PY-19 frontage, next to the entrance, in full view of highway traffic. The architecture has not been defined yet — the volumes are illustrative.',
      es: 'Comercio frente a la PY-19, junto a la entrada, a la vista de quien pasa por la ruta. La arquitectura aún no está definida — los volúmenes son ilustrativos.' },
    photos: ['park/select-comercial-dia.jpg', 'park/select-fachada-brises.jpg', 'park/select-comercial-noite.jpg'], link: 'select.html' },
  { id: 'market', poly: [[65.6, 15.9], [69.6, 15.9], [69.6, 40.0], [65.6, 40.0]], at: [67.4, 27.0], ph: 30, dist: 640,
    name: { pt: 'Bracerum Market', en: 'Bracerum Market', es: 'Bracerum Market' },
    kpis: [
      { t: { pt: 'faixa comercial ao longo do acesso ao Condo, da Via Costeira até o Supermercado', en: 'retail strip along the Condo access road, from the Via Costeira to the supermarket', es: 'franja comercial a lo largo del acceso al Condo, de la Vía Costera al Supermercado' } }],
    text: { pt: 'A faixa comercial desce da Via Costeira até o Supermercado, entre a área industrial e o Bracerum Condo. A arquitetura ainda não foi definida — os volumes são ilustrativos.',
      en: 'The retail strip runs down from the Via Costeira to the supermarket, between the industrial area and Bracerum Condo. The architecture has not been defined yet — the volumes are illustrative.',
      es: 'La franja comercial baja de la Vía Costera hasta el Supermercado, entre el área industrial y el Bracerum Condo. La arquitectura aún no está definida — los volúmenes son ilustrativos.' },
    photos: ['park/select-comercial-dia.jpg', 'park/select-market-interior.jpg'], link: 'select.html' },
  { id: 'tecnologico', poly: [[73.0, 10.5], [78.2, 10.5], [78.2, 19.8], [73.0, 19.8]], at: [75.5, 16.6], ph: 40, dist: 420,
    name: { pt: 'Centro Tecnológico', en: 'Technology Center', es: 'Centro Tecnológico' },
    kpis: [
      { n: 9785, u: 'm²', l: { pt: 'Centro Tecnológico e Espaço Business, com roof top', en: 'Technology Center and Business Space, with a roof top', es: 'Centro Tecnológico y Espacio Business, con roof top' } },
      { n: 4, u: { pt: 'pavimentos', en: 'floors', es: 'pisos' }, l: { pt: 'dois edifícios espelhados em volta de um espelho d’água', en: 'two mirrored buildings around a reflecting pool', es: 'dos edificios espejados alrededor de un espejo de agua' } }],
    text: { pt: 'Na entrada da ponta norte, entre os estacionamentos: escritórios, coworking e salas de reunião para as empresas do parque.',
      en: 'At the entrance to the north end, between the car parks: offices, coworking and meeting rooms for the companies in the park.',
      es: 'En la entrada de la punta norte, entre los estacionamientos: oficinas, coworking y salas de reunión para las empresas del parque.' },
    photos: ['park/tec-fachada.jpg', 'park/tec-recepcao.jpg', 'park/tec-lounge.jpg', 'park/tec-coworking.jpg'] },
  { id: 'hotel', poly: [[79.3, 15.4], [92.0, 15.4], [92.0, 26.2], [79.3, 26.2]], at: [82.3, 18.2], ph: 72, dist: 560,
    name: { pt: 'Hotel', en: 'Hotel', es: 'Hotel' },
    kpis: [
      { n: 384, u: 'studios', l: { pt: 'Bracerum Hotel · 30.000 m²', en: 'Bracerum Hotel · 30,000 m²', es: 'Bracerum Hotel · 30.000 m²' } },
      { n: 1986, u: { pt: 'vagas', en: 'spaces', es: 'plazas' }, l: { pt: 'para carros e mais 500 para motos', en: 'for cars, plus 500 for motorcycles', es: 'para autos y otras 500 para motos' } }],
    text: { pt: 'A torre de varandas do hotel encosta na cobertura em casca do centro de eventos, na ponta norte, cercada pelos estacionamentos arborizados que atendem a cidade e o hotel.',
      en: 'The hotel’s balconied tower leans against the shell roof of the events center at the north end, surrounded by the tree-lined car parks that serve the city and the hotel.',
      es: 'La torre de balcones del hotel se apoya en la cubierta en cáscara del centro de eventos, en la punta norte, rodeada por los estacionamientos arbolados que atienden a la ciudad y al hotel.' },
    photos: ['web/fotos/hotel-fachada-varandas.jpg', 'web/fotos/hotel-cupula-piscina.jpg', 'web/fotos/hotel-recepcao.jpg', 'web/fotos/hotel-quarto.jpg', 'web/fotos/hotel-varanda-vista.jpg'], link: 'hotel.html' },
  { id: 'eventos', poly: [[79.3, 7.4], [92.0, 7.4], [92.0, 15.4], [79.3, 15.4]], at: [86.3, 11.6], ph: 50, dist: 600,
    name: { pt: 'Centro de eventos', en: 'Events center', es: 'Centro de eventos' },
    kpis: [
      { n: 13500, u: 'm²', l: { pt: 'Centro de Convenções', en: 'convention center', es: 'centro de convenciones' } },
      { n: 1200, u: { pt: 'lugares', en: 'seats', es: 'lugares' }, l: { pt: 'no anfiteatro', en: 'in the amphitheater', es: 'en el anfiteatro' } }],
    text: { pt: 'A cobertura em casca de vidro do Centro de Convenções reúne feiras, congressos e o anfiteatro de 1.200 lugares, colada ao hotel. O Salão de Eventos, de 3.200 m², fica no Bracerum Club.',
      en: 'The glass shell roof of the Convention Center hosts fairs, congresses and the 1,200-seat amphitheater, right next to the hotel. The 3,200 m² event hall is at Bracerum Club.',
      es: 'La cubierta en cáscara de vidrio del Centro de Convenciones reúne ferias, congresos y el anfiteatro de 1.200 lugares, junto al hotel. El Salón de Eventos, de 3.200 m², está en el Bracerum Club.' },
    photos: ['web/fotos/hotel-cupula-dia.jpg', 'web/fotos/convencoes-foyer.jpg', 'web/fotos/convencoes-galeria.jpg', 'web/fotos/convencoes-auditorio.jpg', 'web/fotos/convencoes-restaurante.jpg'], link: 'hotel.html' },
  { id: 'escola', poly: [[94.7, 15.0], [98.9, 15.0], [96.6, 23.4], [94.7, 23.4]], at: [96.3, 19.4], ph: 30, dist: 380,
    name: { pt: 'Escola', en: 'School', es: 'Escuela' },
    kpis: [
      { n: 8121, u: 'm²', l: { pt: 'escola e creche', en: 'school and daycare', es: 'escuela y guardería' } },
      { t: { pt: 'escola em arco, creche e campo à frente', en: 'arc-shaped school, daycare and a pitch in front', es: 'escuela en arco, guardería y cancha al frente' } }],
    text: { pt: 'No vértice norte do parque, ao lado do posto de saúde e do Bracerum Condo — para os filhos de quem mora e trabalha no Bracerum Park.',
      en: 'At the northern tip of the park, next to the health post and Bracerum Condo — for the children of people who live and work at Bracerum Park.',
      es: 'En el vértice norte del parque, junto al puesto de salud y al Bracerum Condo — para los hijos de quienes viven y trabajan en Bracerum Park.' },
    photos: [] },
  { id: 'resort', poly: [[65.5, 64.3], [77.4, 64.3], [77.4, 67.3], [66.8, 84.6], [65.5, 84.6]], at: [69.8, 72.6], ph: 30, dist: 620,
    name: { pt: 'Bracerum Resort', en: 'Bracerum Resort', es: 'Bracerum Resort' },
    kpis: [
      { n: 31, u: { pt: 'lotes', en: 'lots', es: 'lotes' }, l: { pt: 'residenciais, de 600 a 1.481 m²', en: 'residential, from 600 to 1,481 m²', es: 'residenciales, de 600 a 1.481 m²' } },
      { n: 38072, u: 'm²', l: { pt: 'área do Resort, com lago, portaria e salão de festas', en: 'Resort area, with a lake, gatehouse and party hall', es: 'superficie del Resort, con lago, portería y salón de fiestas' } }],
    text: { pt: 'Condomínio de casas na borda leste, junto à pista: os lotes se alinham ao longo da via e da diagonal do terreno, em volta de um lago. As casas da maquete são volumes genéricos — as plantas por unidade ainda serão definidas.',
      en: 'A community of houses on the eastern edge, by the runway: the lots line the street and the site’s diagonal edge, around a lake. The houses in this model are generic volumes — unit floor plans are still to be defined.',
      es: 'Condominio de casas en el borde este, junto a la pista: los lotes se alinean a lo largo de la calle y de la diagonal del terreno, alrededor de un lago. Las casas de la maqueta son volúmenes genéricos — las plantas por unidad aún se definirán.' },
    photos: ['web/fotos/resort-lago.jpg', 'web/fotos/resort-casas-rua.jpg', 'web/fotos/resort-casa.jpg'], link: 'resort.html' },
  { id: 'condo', poly: [[69.4, 20.3], [80.7, 20.3], [80.7, 39.4], [86.6, 39.4], [86.6, 50.3], [82.5, 60], [78, 63.6], [65.5, 63.6], [65.5, 51], [69.4, 51]],
    at: [76.2, 40.6], ph: 44, dist: 820,
    name: { pt: 'Bracerum Condo', en: 'Bracerum Condo', es: 'Bracerum Condo' },
    kpis: [
      { n: 1200, u: { pt: 'apartamentos', en: 'apartments', es: 'departamentos' }, l: { pt: 'em 67 torres · 114.273 m²', en: 'in 67 towers · 114,273 m²', es: 'en 67 torres · 114.273 m²' } },
      { n: 16, u: { pt: 'torres', en: 'towers', es: 'torres' }, l: { pt: 'de 1 quarto (384 unidades)', en: 'of one-bedroom units (384)', es: 'de 1 dormitorio (384 unidades)' } },
      { n: 39, u: { pt: 'torres', en: 'towers', es: 'torres' }, l: { pt: 'de 2 quartos (624 unidades)', en: 'of two-bedroom units (624)', es: 'de 2 dormitorios (624 unidades)' } },
      { n: 12, u: { pt: 'torres', en: 'towers', es: 'torres' }, l: { pt: 'de 3 quartos (192 unidades)', en: 'of three-bedroom units (192)', es: 'de 3 dormitorios (192 unidades)' } }],
    text: { pt: 'Moradia ao lado do trabalho: as torres se agrupam em quadras com espelhos d’água e jardins, entre o Outlet, o Bracerum Club e o Resort. Na maquete, as de 1 quarto têm 6 pavimentos e as demais 4, estimados pelo número de unidades.',
      en: 'Homes next to work: the towers are grouped in blocks with reflecting pools and gardens, between the Outlet, Bracerum Club and the Resort. In this model the one-bedroom towers have 6 floors and the others 4, estimated from the number of units.',
      es: 'Vivienda al lado del trabajo: las torres se agrupan en manzanas con espejos de agua y jardines, entre el Outlet, el Bracerum Club y el Resort. En la maqueta, las de 1 dormitorio tienen 6 pisos y las demás 4, estimados por la cantidad de unidades.' },
    photos: [] },
  { id: 'supermercado', poly: [[65.5, 40.0], [69.6, 40.0], [69.6, 51], [65.5, 51]], at: [66.7, 46.3], ph: 30, dist: 380,
    name: { pt: 'Bracerum Market', en: 'Bracerum Market', es: 'Bracerum Market' },
    kpis: [
      { n: 4606, u: 'm²', l: { pt: 'supermercado e 12 lojas, com docas de carga', en: 'supermarket and 12 shops, with loading docks', es: 'supermercado y 12 locales, con muelles de carga' } }],
    text: { pt: 'O supermercado e as lojas fecham a faixa comercial, com estacionamento arborizado e docas próprias para o abastecimento.',
      en: 'The supermarket and shops close the retail strip, with tree-lined parking and their own loading docks.',
      es: 'El supermercado y los locales cierran la franja comercial, con estacionamiento arbolado y muelles propios para el abastecimiento.' },
    photos: ['park/select-market-interior.jpg'], link: 'select.html' },
  { id: 'ambulatorio', poly: [[91.6, 15.6], [94.7, 15.6], [94.7, 21.6], [91.6, 21.6]], at: [93.6, 17.9], ph: 30, dist: 360,
    name: { pt: 'Ambulatório', en: 'Outpatient clinic', es: 'Ambulatorio' },
    kpis: [
      { n: 4113, u: 'm²', l: { pt: 'posto de saúde e ambulatório', en: 'health post and outpatient clinic', es: 'puesto de salud y ambulatorio' } }],
    text: { pt: 'O posto de saúde fica no vértice norte, ao lado do Corpo de Bombeiros, do Posto Policial e da Escola, com acesso direto pela Via Costeira.',
      en: 'The health post is at the northern tip, next to the fire station, the police post and the School, with direct access from the Via Costeira.',
      es: 'El puesto de salud está en el vértice norte, junto a los Bomberos, al Puesto Policial y a la Escuela, con acceso directo por la Vía Costera.' },
    photos: [] },
  { id: 'bombeiros', poly: [[91.6, 10.8], [95.4, 10.8], [94.7, 15.6], [91.6, 15.6]], at: [93.3, 13.9], ph: 30, dist: 360,
    name: { pt: 'Bombeiro Civil', en: 'Fire brigade', es: 'Bomberos civiles' },
    kpis: [
      { n: 620, u: 'm²', l: { pt: 'Corpo de Bombeiros', en: 'fire station', es: 'cuartel de bomberos' } },
      { n: 506, u: 'm²', l: { pt: 'Posto Policial, ao lado', en: 'police post, next door', es: 'puesto policial, al lado' } }],
    text: { pt: 'O Corpo de Bombeiros e o Posto Policial ficam lado a lado no vértice norte, de frente para a Via Costeira, junto ao posto de saúde.',
      en: 'The fire station and the police post sit side by side at the northern tip, facing the Via Costeira, next to the health post.',
      es: 'Los Bomberos y el Puesto Policial están uno al lado del otro en el vértice norte, frente a la Vía Costera, junto al puesto de salud.' },
    photos: [] },
  { id: 'industrial', poly: [[18.3, 8.8], [39.2, 8.8], [39.2, 20.3], [48.9, 20.3], [48.9, 15.9], [65.5, 15.9], [65.5, 80.8], [16.5, 80.8], [16.5, 63.3], [5, 63.3]],
    at: [38.5, 46], ph: 56, dist: 1900,
    name: { pt: 'Lotes industriais', en: 'Industrial lots', es: 'Lotes industriales' },
    kpis: [
      { v: () => `${fmt(L.lotes.length)} ${tr({ pt: 'lotes', en: 'lots', es: 'lotes' })}`, l: () => ({ pt: `à venda, de 1.250 m² (25 × 50 m) cada — ${fmt(L.lotes.reduce((s, l) => s + l.a, 0))} m² no total`, en: `for sale, 1,250 m² (25 × 50 m) each — ${fmt(L.lotes.reduce((s, l) => s + l.a, 0))} m² in total`, es: `en venta, de 1.250 m² (25 × 50 m) cada uno — ${fmt(L.lotes.reduce((s, l) => s + l.a, 0))} m² en total` }) },
      { v: () => `${usd(P.precos[janelaVigente()].P[0][0])}/m²`, l: () => ({ pt: `lote Padrão, 1 a 8 lotes, 20% + 12x — janela ${tr(P.janelas.find((j) => j.id === janelaVigente()).curto)}`, en: `Standard lot, 1 to 8 lots, 20% + 12x — ${tr(P.janelas.find((j) => j.id === janelaVigente()).curto)} window`, es: `lote Estándar, 1 a 8 lotes, 20% + 12x — ventana ${tr(P.janelas.find((j) => j.id === janelaVigente()).curto)}` }) },
      { t: { pt: 'quadras Q01 a Q42; a quadra-padrão tem 200 × 100 m e 16 lotes (Q37, o recinto alfandegado, e Q11, da Administração, ficam fora da oferta)', en: 'blocks Q01 to Q42; a standard block is 200 × 100 m with 16 lots (Q37, the customs bonded area, and Q11, the administration, are not for sale)', es: 'manzanas Q01 a Q42; la manzana estándar tiene 200 × 100 m y 16 lotes (Q37, el recinto aduanero, y Q11, de la Administración, quedan fuera de la oferta)' } }],
    text: { pt: 'A grade industrial ocupa o miolo do parque: quadras separadas por vias com rotatórias, um boulevard arborizado em cada sentido e o canal de drenagem. A unidade de venda é o lote de 1.250 m² — compre um ou junte vários; a partir de 9 lotes o preço por m² cai. O preço depende da categoria do lote: Vitrine (frente da entrada e da avenida principal), Business, Padrão e Interna.',
      en: 'The industrial grid fills the core of the park: blocks separated by streets with roundabouts, a tree-lined boulevard in each direction and the drainage canal. The unit of sale is the 1,250 m² lot — buy one or combine several; from 9 lots up the price per m² drops. The price depends on the lot category: Showcase (facing the entrance and the main avenue), Business, Standard and Inner.',
      es: 'La grilla industrial ocupa el centro del parque: manzanas separadas por calles con rotondas, un bulevar arbolado en cada sentido y el canal de drenaje. La unidad de venta es el lote de 1.250 m² — compre uno o junte varios; desde 9 lotes el precio por m² baja. El precio depende de la categoría del lote: Vitrina (frente a la entrada y a la avenida principal), Business, Estándar e Interna.' },
    photos: ['web/fotos/park-boulevard-aereo-2.jpg', 'web/fotos/galpao-docas.jpg', 'web/fotos/galpao-portico-azul.jpg', 'web/fotos/galpao-via.jpg', 'web/fotos/vias-rotatoria.jpg'],
    link: 'qualidade.html' },
  { id: 'pista', poly: [[1, 75], [16.5, 78.4], [48, 82.4], [60, 87.2], [62.5, 95], [60.5, 100], [1, 82]], at: [31, 84.5], ph: 28, dist: 1500,
    name: { pt: 'Pista de Pouso', en: 'Airstrip', es: 'Pista de aterrizaje' },
    kpis: [
      { n: 1460, u: 'm', l: { pt: 'de pista', en: 'runway length', es: 'de pista' } },
      { n: 73750, u: 'm²', l: { pt: 'pista, heliponto, área de escape e manobra', en: 'runway, helipad, safety and maneuvering areas', es: 'pista, helipuerto, área de escape y maniobra' } }],
    text: { pt: 'A pista corre em diagonal ao longo de toda a borda leste do parque, com faixas verdes dos dois lados. Na ponta sul fica o pátio do Aeroporto de Cargas Bracerum, com os hangares e o heliponto.',
      en: 'The runway runs diagonally along the entire eastern edge of the park, with green strips on both sides. At the southern end is the apron of the Bracerum Cargo Airport, with the hangars and the helipad.',
      es: 'La pista corre en diagonal a lo largo de todo el borde este del parque, con franjas verdes a ambos lados. En la punta sur está la plataforma del Aeropuerto de Cargas Bracerum, con los hangares y el helipuerto.' },
    photos: ['web/fotos/aero-pista-aerea.jpg', 'web/fotos/aero-cabeceira.jpg'] },
  { id: 'hangares', poly: [[3, 63.3], [22.9, 63.3], [22.9, 77.9], [3, 76.2]], at: [8.0, 66.8], ph: 34, dist: 560,
    name: { pt: 'Hangares', en: 'Hangars', es: 'Hangares' },
    kpis: [
      { n: 7686, u: 'm²', l: { pt: '7 hangares, lounge e abastecimento', en: '7 hangars, lounge and refueling', es: '7 hangares, lounge y abastecimiento' } },
      { n: 42060, u: 'm²', l: { pt: 'pátio do Aeroporto de Cargas Bracerum', en: 'Bracerum Cargo Airport apron', es: 'plataforma del Aeropuerto de Cargas Bracerum' } },
      { n: 15619, u: 'm²', l: { pt: 'recinto alfandegado (quadra Q37, 10 lotes), ao lado do pátio', en: 'customs bonded area (block Q37, 10 lots), next to the apron', es: 'recinto aduanero (manzana Q37, 10 lotes), junto a la plataforma' } }],
    text: { pt: 'Os hangares ficam de frente para o pátio, com o estacionamento do aeródromo atrás. Carga e executivos chegam de avião direto ao parque, e o recinto alfandegado fica ao lado.',
      en: 'The hangars face the apron, with the airfield parking behind them. Cargo and executives fly straight into the park, with the customs bonded area next door.',
      es: 'Los hangares dan a la plataforma, con el estacionamiento del aeródromo detrás. Carga y ejecutivos llegan en avión directo al parque, con el recinto aduanero al lado.' },
    photos: ['web/fotos/hangar-bracerum.jpg', 'web/fotos/aero-patio-jato.jpg', 'web/fotos/hangar-interior.jpg'] },
  { id: 'heliponto', poly: [[14.4, 63.3], [16.6, 63.3], [16.6, 77.6], [14.4, 76.6]], at: [15.6, 70.2], ph: 26, dist: 360,
    name: { pt: 'Heliponto', en: 'Helipad', es: 'Helipuerto' },
    kpis: [
      { t: { pt: 'no pátio dos hangares, junto ao abastecimento', en: 'on the hangar apron, next to the refueling point', es: 'en la plataforma de los hangares, junto al abastecimiento' } }],
    text: { pt: 'O heliponto fica no pátio do Aeroporto de Cargas, no fim da fileira de hangares, junto ao abastecimento — executivos chegam de helicóptero direto ao parque.',
      en: 'The helipad is on the Cargo Airport apron, at the end of the row of hangars, next to the refueling point — executives fly in by helicopter straight to the park.',
      es: 'El helipuerto está en la plataforma del Aeropuerto de Cargas, al final de la fila de hangares, junto al abastecimiento — los ejecutivos llegan en helicóptero directo al parque.' },
    photos: [] },
  { id: 'ete', poly: [[5.3, 51.2], [14.2, 51.2], [14.2, 63.3], [5.3, 63.3]], at: [9.2, 58.0], ph: 28, dist: 480,
    name: { pt: 'ETE/ETA', en: 'Wastewater and water treatment', es: 'Plantas de efluentes y de agua' },
    kpis: [
      { n: 14557, u: 'm²', l: { pt: 'E.T.E. e subestação de energia', en: 'wastewater treatment plant and power substation', es: 'planta de efluentes y subestación de energía' } },
      { n: 2772, u: 'm²', l: { pt: 'E.T.A., no vértice norte, junto à Escola', en: 'water treatment plant, at the northern tip, by the School', es: 'planta de agua, en el vértice norte, junto a la Escuela' } },
      { n: 4125, u: 'm²', l: { pt: 'galpões de manutenção do Park', en: 'park maintenance sheds', es: 'galpones de mantenimiento del Park' } }],
    text: { pt: 'Na ponta sul ficam a estação de tratamento de esgoto e a subestação de energia, separadas por uma faixa verde de 16 m, e os galpões de manutenção do parque. A estação de tratamento de água fica na outra ponta, ao lado da Escola.',
      en: 'At the southern end are the wastewater treatment plant and the power substation, separated by a 16 m green strip, and the park’s maintenance sheds. The water treatment plant is at the other end, next to the School.',
      es: 'En la punta sur están la planta de tratamiento de efluentes y la subestación de energía, separadas por una franja verde de 16 m, y los galpones de mantenimiento del parque. La planta de agua está en la otra punta, junto a la Escuela.' },
    photos: ['park/ete-eta.jpg'], link: 'qualidade.html' },
  { id: 'administracao', poly: [[10.3, 35.5], [13.6, 35.5], [13.6, 40.2], [10.3, 40.2]], at: [12.3, 37.6], ph: 26, dist: 340,
    name: { pt: 'Administração Parque', en: 'Park administration', es: 'Administración del Parque' },
    kpis: [
      { n: 1150, u: 'm²', l: { pt: 'Administração do Park, no lote Q11', en: 'park administration, on lot Q11', es: 'administración del Park, en el lote Q11' } }],
    text: { pt: 'A administração do parque fica num lote próprio na borda da grade industrial, perto da ETE e da subestação.',
      en: 'The park administration sits on its own lot at the edge of the industrial grid, near the wastewater plant and the substation.',
      es: 'La administración del parque está en un lote propio en el borde de la grilla industrial, cerca de la planta de efluentes y de la subestación.' },
    photos: [] },
  { id: 'club', poly: [[80.7, 27.0], [94.3, 27.0], [85.4, 44.8], [80.7, 44.8]], at: [86.6, 33.6], ph: 32, dist: 560,
    name: { pt: 'Bracerum Club', en: 'Bracerum Club', es: 'Bracerum Club' },
    kpis: [
      { n: 40706, u: 'm²', l: { pt: 'clube de esporte e lazer', en: 'sports and leisure club', es: 'club de deporte y recreación' } },
      { n: 3200, u: 'm²', l: { pt: 'Salão de Eventos', en: 'event hall', es: 'Salón de Eventos' } },
      { t: { pt: 'dois campos society, poliesportiva, tênis, pádel e beach tennis, piscinas com deck, bar e playground', en: 'two five-a-side pitches, multi-sport court, tennis, padel and beach tennis, pools with decks, bar and playground', es: 'dos canchas de fútbol 7, polideportiva, tenis, pádel y beach tennis, piscinas con deck, bar y juegos infantiles' } }],
    text: { pt: 'Novo no Masterplan V14: o clube fica entre o Bracerum Condo e a Via Costeira, com as quadras de um lado, as piscinas e o bar no meio e o Salão de Eventos na ponta.',
      en: 'New in Master plan V14: the club sits between Bracerum Condo and the Via Costeira, with the courts on one side, the pools and bar in the middle and the event hall at the tip.',
      es: 'Nuevo en el Masterplan V14: el club está entre el Bracerum Condo y la Vía Costera, con las canchas de un lado, las piscinas y el bar en el medio y el Salón de Eventos en la punta.' },
    photos: ['web/fotos/amen-piscina-quincho.jpg', 'web/fotos/amen-quadra.jpg', 'park/amen-salao-eventos.jpg'] },
  { id: 'servicos', poly: [[48.3, 80.8], [65.9, 80.8], [65.9, 85], [63.9, 90], [48.3, 90]], at: [55.0, 84.4], ph: 30, dist: 520,
    name: { pt: 'Refeitório, Grêmio e Hub de serviços', en: 'Canteen, recreation club and services hub', es: 'Comedor, Club Recreativo y Hub de servicios' },
    kpis: [
      { n: 3288, u: 'm²', l: { pt: 'Refeitório', en: 'canteen', es: 'comedor' } },
      { n: 4460, u: 'm²', l: { pt: 'Grêmio Recreativo, com campo e piscina', en: 'recreation club, with a pitch and a pool', es: 'Club Recreativo, con cancha y piscina' } },
      { n: 12180, u: 'm²', l: { pt: 'Hub de serviços para indústrias, em 8 lotes', en: 'industrial services hub, in 8 lots', es: 'Hub de servicios para industrias, en 8 lotes' } }],
    text: { pt: 'No fim do boulevard central, junto à pista: o refeitório e o Grêmio Recreativo de quem trabalha no parque e, ao lado, o Hub de serviços para as indústrias.',
      en: 'At the end of the central boulevard, by the runway: the canteen and recreation club for the people who work in the park and, next to them, the industrial services hub.',
      es: 'Al final del bulevar central, junto a la pista: el comedor y el Club Recreativo de quienes trabajan en el parque y, al lado, el Hub de servicios para las industrias.' },
    photos: ['park/amen-comedor.jpg'] },
];
// apelidos dos endereços antigos (#condominio etc.)
const APELIDO = { condominio: 'condo', aeroporto: 'hangares', infra: 'ete' };
// quando os rótulos se sobrepõem, ganha quem vem antes nesta lista
const PRIORIDADE = ['hotel', 'eventos', 'condo', 'industrial', 'entrada', 'outlet', 'resort', 'club', 'pista', 'tecnologico', 'hangares', 'market',
  'supermercado', 'escola', 'servicos', 'ambulatorio', 'bombeiros', 'clube', 'posto', 'portaria', 'heliponto', 'ete', 'administracao'];
// ordem de teste do clique no chão: do mais específico ao mais amplo
const HIT_ORDER = ['posto', 'clube', 'portaria', 'entrada', 'tecnologico', 'eventos', 'hotel', 'bombeiros', 'ambulatorio', 'escola', 'club',
  'outlet', 'supermercado', 'market', 'resort', 'condo', 'servicos', 'administracao', 'ete', 'heliponto', 'hangares', 'pista', 'industrial'];
// a que ponto pertence cada volume da maquete (x e y do centro do volume em % da prancha)
function pontoDoVolume(tag, x, y) {
  switch (tag) {
    case 'posto e portaria': return x < 40.3 ? 'portaria' : x < 43.6 ? 'posto' : x < 46.9 ? 'clube' : 'portaria';
    case 'outlet': return y < 15.9 ? 'outlet' : 'market';
    case 'supermercado': case 'docas': return 'supermercado';
    case 'galpão': return 'industrial';
    case 'recinto': case 'hangar': return 'hangares';
    case 'centro tecnológico': return 'tecnologico';
    case 'hotel': return 'hotel';
    case 'casca': return 'eventos';
    case 'salão de eventos': case 'bar': case 'vestiário': return 'club';
    case 'escola': case 'creche': return 'escola';
    case 'casa': case 'portaria resort': case 'salão de festas': return 'resort';
    case 'torre': case 'torre1': return 'condo';
    case 'refeitório': case 'grêmio': case 'hub de serviços': return 'servicos';
    case 'ambulatório': return 'ambulatorio';
    case 'bombeiros': case 'policial': return 'bombeiros';
    case 'abastecimento': return 'heliponto';
    case 'ETE': case 'subestação': case 'galpões de manutenção': case 'ETA': return 'ete';
    case 'administração': return 'administracao';
    default: return null;
  }
}
// fachada e telhado por tipo de volume; cor em RGB 0–1 (multiplica a cor do material)
const ESTILO = {
  'galpão': ['w_metal', 'r_metal', [1, 1, 1]], hangar: ['w_metal', 'r_metal', [0.98, 0.98, 0.98]],
  recinto: ['w_metal', 'r_metal', [0.97, 0.97, 0.96]], 'hub de serviços': ['w_metal', 'r_metal', [0.99, 0.99, 0.98]],
  'galpões de manutenção': ['w_metal', 'r_metal', [0.97, 0.97, 0.96]], docas: ['w_metal', 'r_metal', [0.98, 0.98, 0.97]],
  hotel: ['w_floor', 'r_flat', [1, 0.975, 0.94]], torre: ['w_floor', 'r_flat', [1, 0.985, 0.96]], torre1: ['w_floor', 'r_flat', [0.99, 0.98, 0.96]],
  'centro tecnológico': ['w_floor', 'r_flat', [0.97, 0.97, 0.97]], escola: ['w_floor', 'r_flat', [1, 0.98, 0.95]],
  creche: ['w_floor', 'r_flat', [1, 0.98, 0.95]], 'ambulatório': ['w_floor', 'r_flat', [1, 1, 1]],
  bombeiros: ['w_floor', 'r_flat', [0.98, 0.97, 0.95]], policial: ['w_floor', 'r_flat', [0.97, 0.97, 0.97]],
  'administração': ['w_floor', 'r_flat', [1, 1, 1]], 'refeitório': ['w_floor', 'r_flat', [1, 0.98, 0.95]],
  outlet: ['w_shop', 'r_flat', [1, 0.985, 0.96]], supermercado: ['w_shop', 'r_flat', [1, 1, 1]],
  'posto e portaria': ['w_shop', 'r_flat', [1, 1, 1]], 'salão de eventos': ['w_shop', 'r_flat', [1, 0.98, 0.95]],
  'salão de festas': ['w_shop', 'r_flat', [1, 0.98, 0.95]], casa: ['w_house', 'r_house', [1, 1, 1]],
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
    const xs = pts.map((q) => q[0]), zs = pts.map((q) => q[1]);
    const cx = ((Math.min(...xs) + Math.max(...xs)) / 2 + W / 2) / W * 100, cy = ((Math.min(...zs) + Math.max(...zs)) / 2 + H / 2) / H * 100;
    const ai = areaIdx[pontoDoVolume(v.t, cx, cy)] ?? -1;
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
  const ai = areaIdx.eventos;
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
  box.querySelectorAll('.pin3d').forEach((e) => e.remove());   // os rótulos das quadras ficam
  pinEls.length = 0;
  AREAS.forEach((a, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pin3d';
    b.innerHTML = `<span class="pin3d__stem"></span><span class="pin3d__dot"></span><span class="pin3d__tag"><b>${String(i + 1).padStart(2, '0')}</b>${esc(tr(a.name))}</span>`;
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
    if (lado === 'm' && bate(r)) { p.el.style.opacity = 0; p.el.style.pointerEvents = 'none'; continue; }   // losango sobre um nome vizinho: some
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
/* ------------------------------------------------------------------ lotes à venda e preços
   Lotes, categorias e áreas: data/lotes.json (mapa de lotes MP14, Masterplan V14-02, gerado por
   docs/3dmasterplan/build_lotes.py). Preços: data/precos.json (Tabela v3.1, editado à mão).
   Valor = preço por m² (janela × categoria × faixa de quantidade × pagamento) × área de cada lote. */
let L = null, P = null;
let escolhidos = [];                   // os lotes da simulação
let modoLotes = false, somar = false;
let janela = 'expo', pagto = '12x';
const IPAG = { '12x': 0, vista: 1, '36x': 2 };
const camadaLotes = new THREE.Group();
const qtags = [];

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function janelaVigente() {
  const h = hojeISO();
  return (P.janelas.find((j) => h <= (j.ate || '9999-12-31')) || P.janelas[P.janelas.length - 1]).id;
}
const faixaDe = (n) => P.faixas.findIndex((f) => n >= f.de && (f.ate == null || n <= f.ate));
const precoM2 = (cat, n, jan = janela, pag = pagto) => P.precos[jan][cat][faixaDe(n)][IPAG[pag]];
const usd = (v) => `US$${lang === 'en' ? '' : ' '}${fmt(Math.round(v))}`;
const nomeCat = (c) => tr(P.categorias[c].nome);
const subst = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
function calcula(lista, jan = janela, pag = pagto) {
  const n = lista.length, f = faixaDe(n);
  let total = 0, area = 0;
  const cats = {};
  for (const l of lista) {
    const pm = P.precos[jan][l.cat][f][IPAG[pag]];
    total += pm * l.a; area += l.a;
    const c = (cats[l.cat] ||= { n: 0, a: 0, pm, v: 0 });
    c.n++; c.a += l.a; c.v += pm * l.a;
  }
  const np = pag === '12x' ? 12 : pag === '36x' ? 36 : 0;
  const sinal = np ? Math.round(total * 0.2) : total;
  return { n, f, total, area, cats, np, sinal, parcela: np ? (total - sinal) / np : 0 };
}

function preparaLotes() {
  L.porId = new Map();
  for (const l of L.lotes) {
    l._pts = pairs(l.p);
    const xs = l._pts.map((p) => p[0]), ys = l._pts.map((p) => p[1]);
    l._bb = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    L.porId.set(l.id, l);
  }
  for (const q of L.quadras) {
    q._pts = pairs(q.p);
    q._lotes = L.lotes.filter((l) => l.q === q.q);
    const xs = q._pts.map((p) => p[0]), ys = q._pts.map((p) => p[1]);
    q._c = toWorld((Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2);
  }
}
function montaCamadaLotes() {
  const pos = [], col = [];
  const c = new THREE.Color();
  const poe = (pts, cor) => {
    c.set(cor);
    const w = pts.map((p) => toWorld(p[0], p[1]));
    for (const tri of THREE.ShapeUtils.triangulateShape(w.map((p) => new THREE.Vector2(p[0], p[1])), [])) {
      for (const k of tri) { pos.push(w[k][0], 0.16, w[k][1]); col.push(c.r, c.g, c.b); }
    }
  };
  for (const l of L.lotes) poe(l._pts, P.categorias[l.cat].cor);
  for (const q of L.quadras) if (q.fora) poe(q._pts, '#c9c4b8');
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.86,
    depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  m.renderOrder = 1;
  m.raycast = () => {};
  camadaLotes.add(m);
  camadaLotes.visible = false;
  for (const q of L.quadras) {               // rótulo de cada quadra (Q01…Q42), só no modo lotes
    const el = document.createElement('span');
    el.className = 'qtag' + (q.fora ? ' qtag--fora' : '');
    el.textContent = q.q;
    el.setAttribute('aria-hidden', 'true');
    $('#pins').appendChild(el);
    qtags.push({ el, p: new THREE.Vector3(q._c[0], 4, q._c[1]) });
  }
}
function posicionaQuadras() {
  if (!modoLotes) return;
  const w = innerWidth, h = innerHeight, mostra = camera.position.distanceTo(controls.target) < 3800;
  for (const q of qtags) {
    vtmp.copy(q.p).project(camera);
    const ok = mostra && vtmp.z < 1 && Math.abs(vtmp.x) < 1.05 && Math.abs(vtmp.y) < 1.05;
    q.el.style.opacity = ok ? 1 : 0;
    if (ok) q.el.style.transform = `translate3d(${((vtmp.x + 1) / 2 * w).toFixed(1)}px,${((1 - vtmp.y) / 2 * h).toFixed(1)}px,0) translate(-50%,-50%)`;
  }
}
function comIndice(A, sph) {                  // centra no espaço à direita do índice (desktop)
  if (SMALL() || innerWidth <= 1000) return A;
  const k = (2 * sph.r * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / innerHeight;
  return A.clone().addScaledVector(new THREE.Vector3(Math.cos(sph.theta), 0, -Math.sin(sph.theta)), -(350 / 2) * k);
}
function modoLotesOn(on, voo = true) {
  modoLotes = on;
  document.body.classList.toggle('modo-lotes', on);
  $('#tLots').setAttribute('aria-pressed', on ? 'true' : 'false');
  camadaLotes.visible = on;
  if (on) {
    pararTour();
    if (selected && selected.kind !== 'lot') limpaSelecao();
    painelLotes();
    if (voo && !escolhidos.length) {
      const [x, z] = pct([38.5, 47]);
      const retrato = camera.aspect < 1;
      const r = retrato ? caber(H * 0.85, W * 0.6) : caber(W * 0.76, H * 0.95);
      const fim = { r, phi: 0.42, theta: retrato ? -Math.PI / 2 : 0 };
      voar(comIndice(new THREE.Vector3(x, 0, z), fim), fim, 1500);
    }
    if (!selected) try { history.replaceState(null, '', '#lotes'); } catch (e) { /* file:// */ }
    dica(COARSE ? 'lots.howtoTouch' : 'lots.howto', 9000);
  } else {
    qtags.forEach((q) => { q.el.style.opacity = 0; });
    if (!selected) try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* file:// */ }
    dica(null);
  }
  invalidate();
}
function escolheLotes(lista, voo = true) {
  escolhidos = lista;
  if (!lista.length) { limpaSelecao(); return; }
  selected = { kind: 'lot', i: areaIdx.industrial };
  marcaSelecao(-1);
  limpaLote();
  lista.forEach((l) => desenhaLote(l));
  const bb = lista.reduce((b, l) => [Math.min(b[0], l._bb[0]), Math.min(b[1], l._bb[1]), Math.max(b[2], l._bb[2]), Math.max(b[3], l._bb[3])],
    [Infinity, Infinity, -Infinity, -Infinity]);
  const [cx, cz] = toWorld((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2);
  const raio = Math.max(150, Math.hypot(bb[2] - bb[0], bb[3] - bb[1]) * 0.6);
  U.focus.value.set(cx, cz, raio, 1);
  if (voo) {
    const sph = esfera();
    if (sph.r > 1300 || lista.length > 1) {
      const fim = { r: THREE.MathUtils.clamp(raio * 3.4, camera.aspect < 1 ? 720 : 560, 2600), phi: THREE.MathUtils.clamp(sph.phi, 0.45, 0.95), theta: sph.theta };
      voar(comCartao(new THREE.Vector3(cx, 0, cz), fim), fim, 1300);
    }
  }
  try { history.replaceState(null, '', hashLotes(lista)); } catch (e) { /* file:// */ }
  mostraCartaoLotes();
  invalidate();
}
function porQuadra(lista) {                    // [[quadra, lotes, inteira?], ...]
  const g = new Map();
  lista.forEach((l) => { if (!g.has(l.q)) g.set(l.q, []); g.get(l.q).push(l); });
  return [...g].map(([q, ls]) => [q, ls, ls.length > 1 && L.quadras.find((x) => x.q === q)._lotes.length === ls.length]);
}
function hashLotes(lista) {
  if (lista.length === 1) return '#lote-' + lista[0].id;
  const s = porQuadra(lista).map(([q, ls, inteira]) => (inteira ? q : ls.map((l) => l.id).join('-'))).join('-');
  return s.length <= 1500 ? '#lotes-' + s : '#lotes';
}
function lotesDoHash(h) {
  return h.replace(/^lotes?-/, '').split('-').flatMap((id) => (/^Q\d\d$/.test(id) ? L.quadras.find((q) => q.q === id)?._lotes || [] : [L.porId.get(id)])).filter(Boolean);
}
function cliqueLote(l, juntar) {
  if (juntar && escolhidos.length) {
    escolheLotes(escolhidos.includes(l) ? escolhidos.filter((x) => x !== l) : [...escolhidos, l], false);
  } else escolheLotes([l]);
}
function limpaSelecao() {
  selected = null;
  escolhidos = []; somar = false;
  marcaSelecao(-1);
  limpaLote();
  U.focus.value.w = 0;
  fechaCartao();
  try { history.replaceState(null, '', modoLotes ? '#lotes' : location.pathname + location.search); } catch (e) { /* file:// */ }
  invalidate();
}
function limpaLote() {
  lotLayer.children.forEach((m) => { m.geometry.dispose(); m.material.dispose(); });
  lotLayer.clear();
}
function desenhaLote(l, hover = false) {
  const pts = pairs(l.p).map((p) => toWorld(p[0], p[1]));
  const shape = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], -p[1])));
  // por cima de tudo: o lote continua visível mesmo com o galpão ilustrativo em cima dele
  const fill = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: '#efdcae', transparent: true,
    opacity: hover ? 0.3 : 0.62, depthWrite: false, depthTest: false, toneMapped: false, side: THREE.DoubleSide }));
  fill.rotation.x = -Math.PI / 2; fill.position.y = 0.22; fill.renderOrder = 5;
  const line = new THREE.Mesh(fita(pts, hover ? 1.2 : 2.0, 0.32), new THREE.MeshBasicMaterial({ color: '#473315', depthWrite: false, depthTest: false,
    toneMapped: false, transparent: true, opacity: hover ? 0.6 : 1, side: THREE.DoubleSide }));
  line.renderOrder = 6;
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
    const val = (x) => (typeof x === 'function' ? x() : x);
    const v = val(k.v) ?? `${fmt(k.n)} ${tr(k.u)}`.trim();
    return `<div><dt>${esc(v)}</dt><dd>${esc(tr(val(k.l)))}</dd></div>`;
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
  $('#cardCalc').innerHTML = '';
  $('#cardActions').innerHTML = (a.id === 'industrial' && P ? `<button type="button" class="btn" data-acao="modo-lotes">${esc(t('lots.see'))} <span aria-hidden="true">→</span></button>` : '') +
    (a.link ? `<a class="${a.id === 'industrial' ? 'linkbtn' : 'btn'}" href="${SITE}${a.link}">${esc(t('card.site'))} <span aria-hidden="true">→</span></a>` : '');
  $('#cardNav').hidden = false;
  $('#cardCount').textContent = `${i + 1} / ${AREAS.length}`;
  abreCartao();
  card.querySelector('.card__scroll').scrollTop = 0;
}
function segs(rotulo, opcoes, atual, attr) {
  return `<div class="seg" role="group" aria-label="${esc(rotulo)}">${opcoes.map((o) =>
    `<button type="button" data-${attr}="${o.id}" aria-pressed="${o.id === atual}">${esc(o.rot)}</button>`).join('')}</div>`;
}
const segJanela = () => segs(t('lots.window'), P.janelas.map((j) => ({ id: j.id, rot: tr(j.curto) })), janela, 'jan');
function faixaTxt(c) {
  const f = P.faixas[c.f];
  let s = f.ate == null ? subst(t('lot.tierUp'), { de: f.de }) : subst(t('lot.tier'), { de: f.de, ate: f.ate });
  if (c.f < P.faixas.length - 1) {
    const cat = Object.entries(c.cats).sort((a, b) => b[1].a - a[1].a)[0][0];
    s += ' ' + subst(t('lot.next'), { n: P.faixas[c.f + 1].de, c: nomeCat(cat), p: usd(P.precos[janela][cat][c.f + 1][IPAG[pagto]]) });
  }
  return s;
}
function linkProposta(c) {
  const jan = P.janelas.find((j) => j.id === janela), pg = P.pagamentos.find((p) => p.id === pagto);
  const nomes = escolhidos.map((l) => `${l.nome || 'LTIND.' + l.id} — ${nomeCat(l.cat)} — ${fmt(l.a)} m²`);
  const cond = c.np ? subst(t('mail.parc'), { s: usd(c.sinal), n: c.np, p: usd(c.parcela) }) : t('lot.cash');
  const corpo = [t('mail.hello'), '', ...nomes, '', subst(t('mail.sim'), { v: P.tabela }),
    `${t('lots.window')}: ${tr(jan.nome)} (${tr(jan.quando)})`, `${t('lots.pay')}: ${tr(pg.nome)}`,
    `${t(escolhidos.length > 1 ? 'lot.totalOp' : 'lot.total')}: ${usd(c.total)} · ${cond}`, '',
    location.origin + location.pathname + location.hash].join('\n');
  const assunto = subst(t('mail.subject'), { l: escolhidos.length === 1 ? 'LTIND.' + escolhidos[0].id : `${escolhidos.length} ${t('lots.lots')}` });
  return `mailto:${P.contato.emails.join(',')}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
}
/* LTIND.Q07.L014.A01250.ESQNAO.RT.L -> "meio de quadra · retangular · frente leste" */
function feicao(nome) {
  const [, , , , esq, forma, fr] = nome.split('.');
  const lados = (fr || '').split('+').map((c) => t('dir.' + c)).filter((x) => !x.startsWith('dir.'));
  const lista = lados.length > 1 ? lados.slice(0, -1).join(', ') + t('lot.e') + lados[lados.length - 1] : lados[0];
  const frente = lados.length ? subst(t(lados.length > 1 ? 'lot.frentes' : 'lot.frente'), { f: lista }) : '';
  return [t(esq === 'ESQSIM' ? 'lot.esquina' : 'lot.meio'), t(forma === 'PO' ? 'lot.poligonal' : 'lot.retangular'), frente].filter(Boolean).join(' · ');
}
function mostraCartaoLotes() {
  const lista = escolhidos, c = calcula(lista), um = lista.length === 1 ? lista[0] : null;
  const quadras = [...new Set(lista.map((l) => l.q))];
  $('#cardMedia').innerHTML = '';
  $('#cardEyebrow').textContent = um ? subst(t('lot.eyebrow'), { q: um.q })
    : subst(t('lot.multiEyebrow'), { q: quadras.slice(0, 5).join(', ') + (quadras.length > 5 ? '…' : '') });
  $('#cardTitle').textContent = um ? 'LTIND.' + um.id : subst(t('lot.multiTitle'), { n: fmt(lista.length), a: fmt(c.area) });
  const sw = (k) => `<i class="sw" style="background:${P.categorias[k].cor}"></i>`;
  const linhas = um
    ? [[esc(`${um.ex ? '' : '≈ '}${fmt(um.a)} m²`), esc(um.ex ? subst(t('lot.area'), { cod: 'A' + String(um.a).padStart(5, '0') }) : t('lot.areaApprox'))],
       [sw(um.cat) + esc(nomeCat(um.cat)), esc(subst(t('lot.cat'), { f: P.categorias[um.cat].fator }))],
       ...(um.nome ? [['', esc(feicao(um.nome))]] : [])]
    : Object.entries(c.cats).sort((a, b) => b[1].a - a[1].a).map(([k, v]) =>
      [`${sw(k)}${v.n} × ${esc(nomeCat(k))}`, esc(`${fmt(v.a)} m² × ${usd(v.pm)}/m² = ${usd(v.v)}`)]);
  $('#cardKpis').innerHTML = linhas.map(([dt, dd]) => (dt ? `<div><dt>${dt}</dt><dd>${dd}</dd></div>` : `<div class="solo"><dd>${dd}</dd></div>`)).join('');
  const jan = P.janelas.find((j) => j.id === janela);
  const q = L.quadras.find((x) => x.q === (um ? um.q : quadras.length === 1 ? quadras[0] : null));
  const chip = (attr, id, rot) => `<li><button type="button" data-${attr}="${id}" aria-label="${esc(subst(t('lot.remove'), { id: rot }))}">${esc(rot)}<span aria-hidden="true">×</span></button></li>`;
  const itens = porQuadra(lista).flatMap(([qq, ls, inteira]) => (inteira ? [chip('tiraq', qq, `${qq} · ${ls.length} ${t('lots.lots')}`)] : ls.map((l) => chip('tira', l.id, l.id))));
  const chips = lista.length > 1 && itens.length <= 40 ? `<ul class="chips">${itens.join('')}</ul>` : '';
  $('#cardCalc').innerHTML = `
    <p class="calc__lab">${esc(t('lots.window'))}</p>${segJanela()}
    <p class="calc__when">${esc(tr(jan.quando))}</p>
    <p class="calc__lab">${esc(t('lots.pay'))}</p>${segs(t('lots.pay'), P.pagamentos.map((p) => ({ id: p.id, rot: tr(p.nome) })), pagto, 'pag')}
    <div class="calc__res" aria-live="polite">
      <p class="calc__lbl">${esc(t(um ? 'lot.total' : 'lot.totalOp'))}</p>
      <p class="calc__total">${usd(c.total)}</p>
      <p class="calc__m2">${esc(um ? subst(t('lot.m2'), { p: usd(precoM2(um.cat, 1)), a: fmt(um.a) }) : subst(t('lot.m2avg'), { p: usd(c.total / c.area), a: fmt(c.area) }))}</p>
      <dl class="calc__rows">${c.np
        ? `<div><dt>${esc(t('lot.down'))}</dt><dd>${usd(c.sinal)}</dd></div><div><dt>${esc(subst(t('lot.inst'), { n: c.np }))}</dt><dd>${usd(c.parcela)}</dd></div>`
        : `<div><dt>${esc(t('lot.cash'))}</dt><dd>${usd(c.total)}</dd></div>`}</dl>
      <p class="calc__tier">${esc(faixaTxt(c))}</p>
    </div>
    <a class="btn calc__cta" href="${linkProposta(c)}">${esc(t('lot.propose'))} <span aria-hidden="true">→</span></a>
    ${chips}
    <div class="calc__btns">
      <button type="button" class="linkbtn" data-acao="somar" aria-pressed="${somar}">${esc(t(somar ? 'lot.adding' : 'lot.add'))}</button>
      ${q && q._lotes.length > lista.length ? `<button type="button" class="linkbtn" data-acao="quadra" data-q="${q.q}">${esc(subst(t('lot.block'), { q: q.q, n: q._lotes.length }))}</button>` : ''}
      ${lista.length > 1 ? `<button type="button" class="linkbtn" data-acao="limpar">${esc(t('lot.clear'))}</button>` : ''}
    </div>`;
  $('#cardText').textContent = t('lot.notes') + (janela === 'expo' ? ' ' + t('lot.expoNote') : '');
  const aprox = lista.filter((l) => !l.ex);
  $('#cardNote').textContent = aprox.length ? (um ? t('lot.approxNote') : subst(t('lot.approxNoteN'), { n: aprox.length }))
    : um?.nome ? subst(t('lot.nomeOficial'), { n: um.nome }) : '';
  $('#cardActions').innerHTML = `<p class="contact">${esc(P.contato.nomes)} · ${P.contato.emails.map(esc).join(' · ')}</p>`;
  $('#cardNav').hidden = true;
  abreCartao();
}
function mostraRecinto(q) {
  if (q.fora !== 'recinto alfandegado') { escolheArea(areaIdx.administracao); return; }
  selected = { kind: 'recinto', q };
  escolhidos = [];
  marcaSelecao(-1);
  limpaLote();
  desenhaLote(q, false);
  $('#cardMedia').innerHTML = '';
  $('#cardEyebrow').textContent = subst(t('lot.quadra'), { q: q.q });
  $('#cardTitle').textContent = t('q.recinto');
  $('#cardKpis').innerHTML = `<div><dt>${fmt(q.a)} m²</dt><dd>${esc(t('q.recintoArea'))}</dd></div>`;
  $('#cardCalc').innerHTML = '';
  $('#cardText').textContent = t('q.recintoTxt');
  $('#cardNote').textContent = '';
  $('#cardActions').innerHTML = '';
  $('#cardNav').hidden = true;
  abreCartao();
  invalidate();
}
function painelLotes() {
  if (!P) return;
  const cont = {};
  L.lotes.forEach((l) => { cont[l.cat] = (cont[l.cat] || 0) + 1; });
  $('#lotPanel').innerHTML = `
    <p class="eyebrow">${esc(subst(t('lots.eyebrow'), { v: P.tabela }))}</p>
    <h2 class="lotpanel__title">${esc(t('lots.title'))}</h2>
    <p class="lotpanel__sub">${esc(subst(t('lots.sub'), { n: fmt(L.lotes.length), a: fmt(L.lotes.reduce((s, l) => s + l.a, 0)) }))}</p>
    ${segJanela()}
    <p class="calc__when">${esc(tr(P.janelas.find((j) => j.id === janela).quando))}</p>
    <p class="lotpanel__head">${esc(t('lots.legendHead'))}</p>
    <ul class="legend">${['V', 'B', 'P', 'I'].map((k) => `<li><i class="sw" style="background:${P.categorias[k].cor}"></i>
      <span><b>${esc(nomeCat(k))}</b> ×${P.categorias[k].fator}<small>${fmt(cont[k] || 0)} ${esc(t('lots.lots'))}</small></span>
      <em>${usd(P.precos[janela][k][0][0])}<small>/m²</small></em></li>`).join('')}
      <li class="legend__fora"><i class="sw"></i><span>${esc(t('lots.recinto'))}</span></li></ul>
    <p class="lotpanel__how">${esc(t(COARSE ? 'lots.howtoTouch' : 'lots.howto'))}</p>`;
}

/* ------------------------------------------------------------------ apontar e clicar */
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const chaoPlano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function aponta(cx, cy) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(pickables.filter((m) => m.visible), false)[0];
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
  if (!L) return null;
  const X = p.x + W / 2, Y = p.z + H / 2;
  return L.lotes.find((l) => X >= l._bb[0] && X <= l._bb[2] && Y >= l._bb[1] && Y <= l._bb[3] && inPoly(X, Y, l._pts)) || null;
}
function recintoEm(p) {
  if (!L) return null;
  const X = p.x + W / 2, Y = p.z + H / 2;
  return L.quadras.find((q) => q.fora && inPoly(X, Y, q._pts)) || null;
}
function alvoEm(cx, cy) {
  const h = aponta(cx, cy);
  if (!h) return null;
  const chaoOuGalpao = !h.building || h.area === areaIdx.industrial;
  if (chaoOuGalpao || modoLotes) {
    const l = loteEm(h.point);
    if (l) return { lot: l, point: h.point };
    const q = recintoEm(h.point);
    if (q) return { recinto: q, point: h.point };
  }
  if (modoLotes) return { point: h.point };
  return h.area >= 0 ? { area: h.area, point: h.point } : { point: h.point };
}

const tip = $('#tip');
let lotHover = null;
function hoverEm(cx, cy) {
  const a = measure ? null : alvoEm(cx, cy);
  const stage = $('#stage');
  if (!a || (a.area == null && !a.lot && !a.recinto)) {
    setHover(-1); tip.hidden = true; stage.classList.remove('is-point'); hoverLote(null); return;
  }
  stage.classList.add('is-point');
  if (a.lot) {
    setHover(-1); hoverLote(a.lot);
    const l = a.lot, pg = P.pagamentos.find((p) => p.id === pagto), jn = P.janelas.find((j) => j.id === janela);
    tip.innerHTML = `<small>LTIND.${esc(l.id)}</small><b>${esc(nomeCat(l.cat))} · ${l.ex ? '' : '≈ '}${fmt(l.a)} m²</b>${usd(precoM2(l.cat, 1) * l.a)} <span class="tip__m">${esc(tr(jn.curto))} · ${esc(tr(pg.nome))}</span>`;
  } else if (a.recinto) {
    setHover(-1); hoverLote(null);
    const adm = a.recinto.fora !== 'recinto alfandegado';
    tip.innerHTML = `<small>${esc(a.recinto.q)}</small><b>${esc(adm ? tr(AREAS[areaIdx.administracao].name) : t('q.recinto'))}</b>${esc(t('q.fora'))}`;
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
  if (l && !escolhidos.includes(l)) desenhaLote(l, true);
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
  if (modoLotes) modoLotesOn(false, false);
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
  if (P) painelLotes();
  if (selected?.kind === 'lot') mostraCartaoLotes();
  if (selected?.kind === 'recinto') mostraRecinto(selected.q);
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
  $('#tLots').addEventListener('click', () => { modoMedir(false); modoLotesOn(!modoLotes); });
  const controlesLotes = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.jan) { janela = b.dataset.jan; painelLotes(); if (selected?.kind === 'lot') mostraCartaoLotes(); return; }
    if (b.dataset.pag) { pagto = b.dataset.pag; mostraCartaoLotes(); return; }
    if (b.dataset.tira) { escolheLotes(escolhidos.filter((l) => l.id !== b.dataset.tira), false); return; }
    if (b.dataset.tiraq) { escolheLotes(escolhidos.filter((l) => l.q !== b.dataset.tiraq), false); return; }
    const acao = b.dataset.acao;
    if (acao === 'somar') { somar = !somar; mostraCartaoLotes(); dica(somar ? 'lot.adding' : null, 6000); }
    else if (acao === 'quadra') escolheLotes(L.quadras.find((q) => q.q === b.dataset.q)._lotes);
    else if (acao === 'limpar') limpaSelecao();
    else if (acao === 'modo-lotes') { limpaSelecao(); modoLotesOn(true); }
  };
  card.addEventListener('click', controlesLotes);
  $('#lotPanel').addEventListener('click', controlesLotes);
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
    if (e.key === 'Escape') {
      if (measure) modoMedir(false);
      else if (selected) { pararTour(); limpaSelecao(); }
      else if (modoLotes) modoLotesOn(false);
    }
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
    if (a?.lot) cliqueLote(a.lot, somar || e.shiftKey || e.ctrlKey || e.metaKey);
    else if (a?.recinto) mostraRecinto(a.recinto);
    else if (modoLotes) return;                                  // fora de lote, no modo lotes: não perde a simulação
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
  posicionaQuadras();
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
  [S, L, P] = await Promise.all(['scene', 'lotes', 'precos'].map((f) => fetch(`data/${f}.json`).then((r) => r.json())));
  [W, H] = S.sheet;
  janela = janelaVigente();
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
  preparaLotes();
  montaCamadaLotes();
  scene.add(camadaLotes);
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
    const lotes = /^lotes?-/.test(h) ? lotesDoHash(h) : [];
    if (lotes.length) { vistaGeral(1); modoLotesOn(true, false); escolheLotes(lotes); }
    else if (h === 'lotes') { vistaGeral(1); modoLotesOn(true); }
    else if (areaIdx[APELIDO[h] || h] != null) { vistaGeral(1); escolheArea(areaIdx[APELIDO[h] || h]); }
    else { vistaGeral(2600); dica(COARSE ? 'hint.touch' : 'hint.desk', 9000); }
  }, 250);
  window.__bp = { scene, camera, controls, renderer, escolheArea, escolheLotes, modoLotesOn, calcula, vistaGeral, vistaCima, setHora, S, L, P, U,
    estado: () => ({ janela, pagto, escolhidos: escolhidos.map((l) => l.id), modoLotes }) };
}

iniciar().catch((err) => {
  console.error(err);
  $('#loader').classList.add('is-done');
  $('#fallback').hidden = false;
});
