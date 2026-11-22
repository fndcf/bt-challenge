/**
 * Componentes de domínio do torneio, compartilhados pelos 4 formatos e pela
 * página pública
 */

export { TabelaClassificacao } from "./TabelaClassificacao/TabelaClassificacao";
export { GrupoPainel, GruposGrid } from "./GrupoPainel/GrupoPainel";
export { CardConfronto, ListaConfrontos } from "./CardConfronto/CardConfronto";
export { CampoPlacar, ListaPlacares } from "./CampoPlacar/CampoPlacar";
export { ModalResultadosLote } from "./ModalResultadosLote/ModalResultadosLote";
export {
  AcoesChaves,
  CabecalhoChaves,
  EstadoChaves,
  TelaChaves,
} from "./TelaChaves/TelaChaves";
export type { LadoConfronto } from "./CardConfronto/CardConfronto";
