import { Sankhya } from './src/Sankhya';

// Exemplo de uso
// Você deve preencher com credenciais reais para testar
const config = {
    urlBase: 'https://api.sandbox.sankhya.com.br',
    clientId: 'xxxxxxxx',
    clientSecret: 'xxxxxxxx',
    token: 'xxxxxxxx' // Opcional se já tiver token
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

        const loadResponse3 = await sankhya.loadRecord({
            rootEntity: 'GrupoProduto',
            entity: {
                fieldset: {
                    list: "CODGRUPOPROD,DESCRGRUPOPROD,ATIVO,GRUPOICMS,TIPOIMPOSTO,COMCURVA_A,COMCURVA_B,COMCURVA_C,CONSGRUPRODCAT42,VISIVELAPPOS"
                }
            },
            rows: {
                row: {
                    CODGRUPOPROD: {
                        "$": "160700"
                    }
                }
            }
        });
        console.log('LoadRecord Response (Formatted):', JSON.stringify(loadResponse3, null, 2));


        console.log('\nTentando saveRecord...');
        // Cuidado ao testar saveRecord para não criar lixo no banco
        const saveResponse = await sankhya.saveRecord({
            rootEntity: 'GrupoProduto',
            localFields: {
                CODGRUPAI: "160000",
                CODGRUPOPROD: "160700",
                DESCRGRUPOPROD: "GRUPO TESTE INTEGRACAO 3",
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

        console.log('\nTentando saveRecord (Atualização)...');
        const saveResponse2 = await sankhya.saveRecord({
            rootEntity: 'GrupoProduto',
            localFields: {
                CODGRUPAI: "160000",
                CODGRUPOPROD: "160700",
                DESCRGRUPOPROD: "TESTE INT 3 Atualizado1",
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
            },
            key: {
                "CODGRUPOPROD": "160700"
            }
        });
        console.log('SaveRecord Response atualização:', JSON.stringify(saveResponse2, null, 2));

        // =============================================
        // Teste de Inclusão de Pedido de Venda (MgeCom)
        // =============================================
        await testIncluirPedidoVenda(sankhya);

    } catch (error: any) {
        console.error('Erro no teste:', error.message);
        if (error.response) {
            console.error('Detalhes do erro:', error.response.data);
        }
    }
}

/**
 * Testa a inclusão de um Pedido de Venda via CACSP.incluirNota
 * O retorno já vem tratado (sem wrappers { "$": "valor" }) pelo execServiceMgeCom
 */
async function testIncluirPedidoVenda(sankhyaerp: Sankhya) {
    console.log('\n=============================================');
    console.log('Teste: Inclusão de Pedido de Venda (CACSP.incluirNota)');
    console.log('=============================================');

    try {
        const pedidoVendaSK = await sankhyaerp.execServiceMgeCom('CACSP.incluirNota', {
            "nota": {
                "cabecalho": {
                    "NUNOTA": null,
                    "CODPARC": "102",
                    "DTNEG": "20/02/2026",
                    "CODTIPOPER": "1004",
                    "CODTIPVENDA": "35",
                    "CODVEND": "0",
                    "CODEMP": "12",
                    "TIPMOV": "P",
                    "CODNAT": "80102002",
                    "CODCENCUS": "370100"
                },
                "itens": {
                    "INFORMARPRECO": "True",
                    "item": [
                        {
                            "NUNOTA": null,
                            "CODPROD": "2054",
                            "QTDNEG": "1",
                            "CODLOCALORIG": "0",
                            "CODVOL": "0",
                            "PERCDESC": "0",
                            "VLRUNIT": "10001.75"
                        }
                    ]
                }
            }
        });

        console.log('\n--- Retorno já tratado (JSON amigável) ---');
        console.log(JSON.stringify(pedidoVendaSK, null, 2));

        // Extrai informações principais de forma direta
        if (pedidoVendaSK?.responseBody?.pk?.NUNOTA) {
            const nunota = pedidoVendaSK.responseBody.pk.NUNOTA;
            console.log(`\n✅ Pedido de Venda incluído com sucesso! NUNOTA: ${nunota}`);
        } else {
            console.log('\n⚠️  Pedido criado, mas não foi possível extrair o NUNOTA do retorno.');
        }

        if (pedidoVendaSK?.status === '1') {
            console.log('📋 Status: Sucesso');
        } else {
            console.log(`📋 Status: ${pedidoVendaSK?.status ?? 'Desconhecido'}`);
        }

        if (pedidoVendaSK?.transactionId) {
            console.log(`🔑 Transaction ID: ${pedidoVendaSK.transactionId}`);
        }

    } catch (error: any) {
        console.error('\n❌ Erro ao incluir Pedido de Venda:', error.message);
        if (error.response) {
            console.error('Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

runTest();
