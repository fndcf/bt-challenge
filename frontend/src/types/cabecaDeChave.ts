export interface CabecaDeChave {
  id: string;
  arenaId: string;
  etapaId: string;
  jogadorId: string;
  jogadorNome: string;
  jogadorNivel?: string;
  jogadorGenero?: string;
  ordem: number;
  ativo: boolean;
  motivoDesativacao?: string;
  criadoEm: any;
  atualizadoEm: any;
}

export interface CriarCabecaDeChaveDTO {
  arenaId: string;
  etapaId: string;
  jogadorId: string;
  jogadorNome: string;
  jogadorNivel?: string;
  jogadorGenero?: string;
  ordem: number;
}
