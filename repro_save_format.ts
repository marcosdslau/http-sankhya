import { SankhyaHelper } from './src/SankhyaHelper';

const localFields = {
    CODGRUPOPROD: "20310006",
    DESCRGRUPOPROD: "GRUPO TESTE INTEGRACAO",
    ATIVO: "S",
    GRUPOICMS: "1",
    TIPOIMPOSTO: "1",
    COMCURVA_A: "0",
    COMCURVA_B: "0",
    COMCURVA_C: "0",
    CONSGRUPRODCAT42: "N",
    VISIVELAPPOS: "S"
};

const transformed = SankhyaHelper.transformLocalFields(localFields);
console.log(JSON.stringify(transformed, null, 2));
