import { Sankhya } from './src/Sankhya';

// Exemplo de uso
// Você deve preencher com credenciais reais para testar
const config = {
    urlBase: 'https://api.sandbox.sankhya.com.br',
    clientId: 'xxxxx',
    clientSecret: 'xxxxxxx',
    token: 'xxxxxx' // Opcional se já tiver token
};

const sankhya = new Sankhya(config);

async function runTest() {
    try {
        console.log('Tentando Login...');
        const loginResponse = await sankhya.login();
        console.log('Login Response:', JSON.stringify(loginResponse, null, 2));

        console.log('\nTentando loadRecords (Exemplo: Usuario)...');
        // Exemplo: Buscar usuário logado (assumindo tabela TSIUSU e criterio simples, ajuste conforme necessario)
        // rootEntity deve ser o nome da instância da entidade no Sankhya (ex: Usuario)
        const loadResponse = await sankhya.loadRecords({
            rootEntity: 'GrupoProduto'
        });
        console.log('LoadRecords Response (Formatted):', JSON.stringify(loadResponse, null, 2));

        if (Array.isArray(loadResponse)) {
            console.log('Total registros encontrados:', loadResponse.length);
            if (loadResponse.length > 0) {
                console.log('Exemplo do primeiro registro:', loadResponse[0]);
            }
        }

        const loadResponse2 = await sankhya.loadRecord({
            rootEntity: 'GrupoProduto',
            entity: {
                fieldset: {
                    list: "CODGRUPOPROD,DESCRGRUPOPROD,ATIVO,GRUPOICMS,TIPOIMPOSTO,COMCURVA_A,COMCURVA_B,COMCURVA_C,CONSGRUPRODCAT42,VISIVELAPPOS"
                }
            },
            rows: {
                row: {
                    CODGRUPOPROD: {
                        "$": "10700"
                    }
                }
            }
        });
        console.log('LoadRecord Response (Formatted):', JSON.stringify(loadResponse2, null, 2));


        console.log('\nTentando saveRecord...');
        // Cuidado ao testar saveRecord para não criar lixo no banco
        const saveResponse = await sankhya.saveRecord({
            rootEntity: 'CRUDServiceProvider.saveRecord',
            localFields: {
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
            },
            entity: {
                fieldset: {
                    list: "CODGRUPOPROD,DESCRGRUPOPROD,ATIVO"
                }
            }
        });
        console.log('SaveRecord Response:', JSON.stringify(saveResponse, null, 2));


    } catch (error: any) {
        console.error('Erro no teste:', error.message);
        if (error.response) {
            console.error('Detalhes do erro:', error.response.data);
        }
    }
}

runTest();
