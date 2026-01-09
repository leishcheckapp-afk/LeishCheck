// script.js 
let pagina = 0;
const perguntas = [
    "Você mora em área rural ou de mata?",
    "Já viajou para locais com casos de leishmaniose?",
    "Possui lesão na pele que não cicatriza?",
    "A lesão está crescendo com o tempo?",
    "A lesão não dói e tem aspecto ulcerado?",
    "Houve contato com animais infectados?",
    "Mora em área endêmica?",
    "Já teve leishmaniose antes?",
    "A ferida tem mais de 2 semanas?",
    "A lesão surgiu após picada de inseto?"
];
const respostas = [];
let modelo = null;
let classes = ["Negativo", "Positivo"];
let modeloCarregado = false;
let statusCarregamento = 'pendente';

//  CARREGAMENTO DO MODELO
async function carregarModeloTFJS() {
    console.log('🚀 Iniciando carregamento do modelo TensorFlow.js...');
    
    // Verificar se TensorFlow.js está disponível
    if (typeof tf === 'undefined') {
        console.error('❌ TensorFlow.js não está carregado!');
        statusCarregamento = 'erro';
        return false;
    }
    
    const caminhosParaTestar = [
        'model.json',
        './model.json',
        'model/model.json',
        '/model.json'
    ];
    
    for (const caminho of caminhosParaTestar) {
        try {
            console.log(`🔍 Tentando carregar modelo de: ${caminho}`);
            
            // Verificar se o arquivo existe
            const resposta = await fetch(caminho, { method: 'HEAD' });
            if (!resposta.ok) {
                console.log(`Arquivo não encontrado em: ${caminho}`);
                continue;
            }
            
            console.log(`📦 Carregando modelo de: ${caminho}...`);
            modelo = await tf.loadLayersModel(caminho);
            
            console.log('✅ Modelo carregado com sucesso!');
            modeloCarregado = true;
            statusCarregamento = 'sucesso';
            
            // Testar o modelo
            await testarModelo();
            
            // Atualizar UI se estiver na página de foto
            atualizarStatusModeloUI();
            
            return true;
            
        } catch (error) {
            console.log(`❌ Falha ao carregar de ${caminho}:`, error.message);
        }
    }
    
    console.error('❌ Não foi possível carregar o modelo de nenhum caminho');
    statusCarregamento = 'erro';
    modeloCarregado = false;
    
    // Criar modelo placeholder para desenvolvimento
    criarModeloPlaceholder();
    
    return false;
}

// ==================== FUNÇÕES DO TERMO ====================

// Habilitar botão quando checkbox for marcado
document.addEventListener('DOMContentLoaded', function() {
    const checkbox = document.getElementById('aceitoTermo');
    const btnAceitar = document.getElementById('btnAceitar');
    
    if (checkbox && btnAceitar) {
        checkbox.addEventListener('change', function() {
            btnAceitar.disabled = !this.checked;
            if (this.checked) {
                btnAceitar.style.backgroundColor = '#00796B';
            } else {
                btnAceitar.style.backgroundColor = '#cccccc';
            }
        });
    }
});

// Função para verificar aceite do termo
function verificarAceite() {
    const checkbox = document.getElementById('aceitoTermo');
    
    if (!checkbox.checked) {
        alert("Por favor, marque a opção 'Declaro que li e compreendo' para continuar.");
        return;
    }
    
    // Registrar aceite no localStorage
    const dadosAceite = {
        aceito: true,
        data: new Date().toISOString(),
        versao: '1.0'
    };
    
    localStorage.setItem('termoLeishCheck', JSON.stringify(dadosAceite));
    
    console.log('✅ Termo aceito pelo usuário');
    
    // Continuar para próxima página
    nextPage();
}

// Função para recusar o termo
function recusarTermo() {
    if (confirm("Para utilizar o LeishCheck é necessário aceitar o termo de consentimento. Deseja realmente sair?")) {
        // Mostrar mensagem de saída
        document.getElementById('tcle').innerHTML = `
            <div class="recusa-termo">
                <h3>Termo Não Aceito</h3>
                <div class="icone-recusa">❌</div>
                <p>O uso do LeishCheck requer a aceitação do termo de consentimento.</p>
                <p>Se mudar de ideia, você pode recarregar a página.</p>
                <button onclick="location.reload()" class="btn-recarregar">
                    Recarregar e Reconsiderar
                </button>
            </div>
        `;
        
        // Registrar recusa
        localStorage.setItem('termoLeishCheck', JSON.stringify({
            aceito: false,
            data: new Date().toISOString()
        }));
    }
}

// Verificar se já aceitou o termo anteriormente (opcional)
function verificarTermoAnterior() {
    const termoSalvo = localStorage.getItem('termoLeishCheck');
    
    if (termoSalvo) {
        const dados = JSON.parse(termoSalvo);
        if (dados.aceito && dados.data) {
            // Pode mostrar mensagem ou pular termo
            console.log('Usuário já aceitou termo em:', dados.data);
            
            // Opcional: mostrar que já aceitou antes
            const checkbox = document.getElementById('aceitoTermo');
            const btnAceitar = document.getElementById('btnAceitar');
            
            if (checkbox && btnAceitar) {
                checkbox.checked = true;
                btnAceitar.disabled = false;
                btnAceitar.style.backgroundColor = '#00796B';
            }
        }
    }
}

// Adicionar esta chamada na inicialização
document.addEventListener('DOMContentLoaded', function() {
    verificarTermoAnterior(); // Verificar termo anterior
    // ... resto do seu código de inicialização
});

// Função para criar um modelo placeholder para desenvolvimento
function criarModeloPlaceholder() {
    console.warn('⚠️ Criando modelo placeholder para desenvolvimento...');
    
    try {
        // Criar um modelo simples para testes
        const model = tf.sequential();
        model.add(tf.layers.conv2d({
            inputShape: [224, 224, 3],
            filters: 16,
            kernelSize: 3,
            activation: 'relu'
        }));
        model.add(tf.layers.maxPooling2d({poolSize: 2}));
        model.add(tf.layers.flatten());
        model.add(tf.layers.dense({units: 2, activation: 'softmax'}));
        
        modelo = model;
        modeloCarregado = true;
        statusCarregamento = 'placeholder';
        
        console.warn('✅ Modelo placeholder criado (APENAS PARA DESENVOLVIMENTO)');
        console.warn('⚠️ AVISO: Este é um modelo falso para testes. Não use para produção!');
        
    } catch (error) {
        console.error('❌ Erro ao criar modelo placeholder:', error);
        statusCarregamento = 'erro';
    }
}

// Testar o modelo carregado
async function testarModelo() {
    if (!modelo) return;
    
    try {
        console.log('🧪 Testando modelo com entrada de exemplo...');
        
        // Criar tensor de teste (224x224 pixels, RGB)
        const testeTensor = tf.ones([1, 224, 224, 3]).mul(0.5);
        
        const predicao = modelo.predict(testeTensor);
        const resultado = await predicao.data();
        
        console.log('✅ Teste de modelo bem-sucedido!');
        console.log('Resultado:', resultado);
        console.log('Formato esperado: [prob_negativo, prob_positivo]');
        
        // Limpar memória
        testeTensor.dispose();
        predicao.dispose();
        
    } catch (error) {
        console.error('❌ Erro no teste do modelo:', error);
    }
}

// Atualizar UI com status do modelo
function atualizarStatusModeloUI() {
    const fotoDiv = document.getElementById('foto');
    if (!fotoDiv) return;
    
    let statusHTML = '';
    
    if (statusCarregamento === 'sucesso') {
        statusHTML = `
            <div class="model-status success">
                <span>✅ IA Carregada</span>
                <small>Pronta para análise de imagens</small>
            </div>
        `;
    } else if (statusCarregamento === 'placeholder') {
        statusHTML = `
            <div class="model-status warning">
                <span>⚠️ Modo Desenvolvimento</span>
                <small>Usando modelo simulado para testes</small>
            </div>
        `;
    } else if (statusCarregamento === 'erro') {
        statusHTML = `
            <div class="model-status error">
                <span>❌ IA Desativada</span>
                <small>Análise de imagem não disponível</small>
            </div>
        `;
    }
    
    // Inserir status antes do botão de enviar
    const botaoEnviar = fotoDiv.querySelector('button[onclick="calcularRisco()"]');
    if (botaoEnviar) {
        botaoEnviar.insertAdjacentHTML('beforebegin', statusHTML);
    }
}

// ==================== FUNÇÕES DE NAVEGAÇÃO ====================
function nextPage() {
    const divs = ["tcle", "resumo", "dados", "questionario", "foto", "resultado", "educacao", "final"];
    
    // Esconder página atual
    if (pagina >= 0 && pagina < divs.length) {
        document.getElementById(divs[pagina]).classList.add("hidden");
    }
    
    // Avançar página
    pagina++;
    
    // Mostrar próxima página
    if (pagina < divs.length) {
        document.getElementById(divs[pagina]).classList.remove("hidden");
        
        // Ações específicas para cada página
        if (pagina === 3) {
            carregarPergunta(0);
        } else if (pagina === 4) { // Página da foto
            if (statusCarregamento === 'pendente') {
                carregarModeloTFJS();
            } else {
                setTimeout(atualizarStatusModeloUI, 100);
            }
        }
    }
}

function mostrarEducacao() {
    document.getElementById("resultado").classList.add("hidden");
    document.getElementById("educacao").classList.remove("hidden");
    pagina = 6;
}

// ==================== QUESTIONÁRIO ====================
function carregarPergunta(i) {
    const progresso = ((i + 1) / perguntas.length) * 100;
    
    document.getElementById("questionario").innerHTML = `
        <div class="question">
            <h3>${perguntas[i]}</h3>
            <div class="button-group">
                <button onclick="responder(${i}, 1)" class="btn-sim">
                    <span>Sim</span>
                </button>
                <button onclick="responder(${i}, 0)" class="btn-nao">
                    <span>Não</span>
                </button>
            </div>
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progresso}%"></div>
                </div>
                <div class="progress-text">
                    Pergunta ${i + 1} de ${perguntas.length}
                </div>
            </div>
        </div>
    `;
}

function responder(i, resposta) {
    respostas[i] = resposta;
    
    if (i + 1 < perguntas.length) {
        carregarPergunta(i + 1);
    } else {
        nextPage();
    }
}

// ==================== PROCESSAMENTO DE IMAGEM ====================
function criarCanvasDaImagem(img) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Configurar canvas
        canvas.width = 224;
        canvas.height = 224;
        
        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, 224, 224);
        
        // Aplicar melhorias para análise médica
        ctx.filter = 'contrast(1.1) brightness(1.05)';
        ctx.drawImage(canvas, 0, 0);
        
        resolve(canvas);
    });
}

async function preprocessarImagemParaModelo(img) {
    return tf.tidy(() => {
        console.log('🖼️ Pré-processando imagem...');
        
        // Converter imagem para tensor
        let tensor = tf.browser.fromPixels(img);
        
        // Redimensionar para 224x224 (exigido pelo modelo)
        tensor = tf.image.resizeBilinear(tensor, [224, 224]);
        
        // Normalizar para [0, 1]
        tensor = tensor.div(255.0);
        
        // Verificar dimensões
        console.log('Dimensões do tensor:', tensor.shape);
        
        // Adicionar dimensão do batch
        tensor = tensor.expandDims(0);
        
        return tensor;
    });
}

async function analisarImagemComIA(imagemElement) {
    console.log('🤖 Iniciando análise com IA...');
    
    if (!modelo || !modeloCarregado) {
        console.warn('Modelo não disponível, retornando análise simulada');
        return criarResultadoSimulado();
    }
    
    try {
        // Pré-processar imagem
        const tensor = await preprocessarImagemParaModelo(imagemElement);
        console.log('Tensor preparado:', tensor.shape);
        
        // Fazer predição
        console.log('🔮 Fazendo predição...');
        const inicio = Date.now();
        const predicao = modelo.predict(tensor);
        const resultados = await predicao.data();
        const tempo = Date.now() - inicio;
        
        console.log(`⏱️ Tempo de predição: ${tempo}ms`);
        console.log('Resultados brutos:', resultados);
        
        // Limpar memória
        tensor.dispose();
        predicao.dispose();
        
        // Interpretar resultados
        // Modelo retorna: [probabilidade_negativo, probabilidade_positivo]
        const probNegativo = resultados[0];
        const probPositivo = resultados[1];
        
        const resultado = {
            probabilidadePositiva: Math.round(probPositivo * 100),
            probabilidadeNegativa: Math.round(probNegativo * 100),
            classePredita: probPositivo > probNegativo ? 1 : 0,
            confianca: Math.max(probPositivo, probNegativo) * 100,
            tempoProcessamento: tempo,
            usandoModeloReal: statusCarregamento === 'sucesso'
        };
        
        console.log('📊 Resultado da IA:', resultado);
        return resultado;
        
    } catch (error) {
        console.error('❌ Erro na análise de imagem:', error);
        console.error('Stack trace:', error.stack);
        
        return {
            probabilidadePositiva: 50,
            probabilidadeNegativa: 50,
            classePredita: 0,
            confianca: 0,
            tempoProcessamento: 0,
            erro: error.message,
            usandoModeloReal: false
        };
    }
}

// Resultado simulado para desenvolvimento
function criarResultadoSimulado() {
    console.log('🎭 Gerando resultado simulado...');
    
    // Simular análise com alguma aleatoriedade
    const aleatorio = Math.random();
    const probPositiva = Math.round(aleatorio * 70 + 10); // 10-80%
    
    return {
        probabilidadePositiva: probPositiva,
        probabilidadeNegativa: 100 - probPositiva,
        classePredita: probPositiva > 50 ? 1 : 0,
        confianca: Math.max(probPositiva, 100 - probPositiva),
        tempoProcessamento: Math.round(Math.random() * 500 + 200),
        usandoModeloReal: false,
        simulado: true
    };
}

// ==================== CÁLCULO DE RISCO ====================
async function calcularRisco() {
    console.log('📈 Calculando risco...');
    
    // Mostrar estado de carregamento
    const botao = document.querySelector('#foto button');
    const textoOriginal = botao.textContent;
    botao.innerHTML = '<span class="loading">⏳ Analisando...</span>';
    botao.disabled = true;
    
    // Calcular score do questionário
    const totalRespostas = respostas.reduce((soma, resposta) => soma + (resposta || 0), 0);
    const percentualQuestionario = Math.round((totalRespostas / perguntas.length) * 100);
    
    console.log(`📋 Questionário: ${totalRespostas}/${perguntas.length} = ${percentualQuestionario}%`);
    
    let resultadoIA = null;
    const inputImagem = document.getElementById('imagem');
    const arquivoImagem = inputImagem.files[0];
    
    // Processar imagem se enviada
    if (arquivoImagem) {
        console.log('📸 Imagem encontrada, processando...');
        
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            // Criar um canvas de pré-visualização
            const previewDiv = document.getElementById('foto');
            const previewCanvas = document.createElement('canvas');
            previewCanvas.width = 150;
            previewCanvas.height = 150;
            previewCanvas.style.cssText = `
                margin: 10px auto;
                display: block;
                border: 2px solid #00796B;
                border-radius: 10px;
            `;
            
            // Carregar imagem
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    // Mostrar pré-visualização
                    const ctx = previewCanvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, 150, 150);
                    
                    if (previewDiv && !previewDiv.querySelector('canvas')) {
                        botao.insertAdjacentElement('beforebegin', previewCanvas);
                    }
                    
                    resolve();
                };
                img.onerror = reject;
                img.src = URL.createObjectURL(arquivoImagem);
            });
            
            // Analisar com IA
            resultadoIA = await analisarImagemComIA(img);
            
            // Liberar URL da imagem
            URL.revokeObjectURL(img.src);
            
            console.log('✅ Imagem processada:', resultadoIA);
            
        } catch (error) {
            console.error('❌ Erro ao processar imagem:', error);
            resultadoIA = {
                probabilidadePositiva: 50,
                erro: 'Falha ao processar imagem'
            };
        }
    } else {
        console.log('📷 Nenhuma imagem enviada');
    }
    
    // Calcular resultado combinado
    const resultadoCombinado = calcularResultadoCombinado(percentualQuestionario, resultadoIA);
    
    // Restaurar botão
    botao.innerHTML = textoOriginal;
    botao.disabled = false;
    
    // Exibir resultados
    exibirResultadoCompleto(resultadoCombinado);
    nextPage();
}

function calcularResultadoCombinado(percentualQuestionario, resultadoIA) {
    console.log('🧮 Calculando resultado combinado...');
    
    let resultadoFinal;
    
    if (resultadoIA && !resultadoIA.erro) {
        // Ponderar: 60% questionário, 40% IA (ou ajuste conforme confiança na IA)
        const pesoQuestionario = 0.6;
        const pesoIA = 0.4;
        
        const percentualCombinado = Math.round(
            (percentualQuestionario * pesoQuestionario) + 
            (resultadoIA.probabilidadePositiva * pesoIA)
        );
        
        resultadoFinal = {
            percentual: Math.min(percentualCombinado, 100),
            origem: 'combinado',
            usandoIA: true,
            detalhes: {
                questionario: percentualQuestionario,
                ia: resultadoIA.probabilidadePositiva,
                classeIA: resultadoIA.classePredita === 1 ? 'Positivo' : 'Negativo',
                confiancaIA: Math.round(resultadoIA.confianca),
                usandoModeloReal: resultadoIA.usandoModeloReal,
                tempoProcessamento: resultadoIA.tempoProcessamento
            }
        };
        
        console.log(`🔀 Combinado: ${percentualQuestionario}% (quest) + ${resultadoIA.probabilidadePositiva}% (IA) = ${resultadoFinal.percentual}%`);
        
    } else {
        // Usar apenas questionário
        resultadoFinal = {
            percentual: percentualQuestionario,
            origem: 'questionario',
            usandoIA: false,
            detalhes: {
                questionario: percentualQuestionario,
                ia: resultadoIA ? resultadoIA.probabilidadePositiva : 0,
                classeIA: resultadoIA ? (resultadoIA.classePredita === 1 ? 'Positivo' : 'Negativo') : 'Não analisado',
                confiancaIA: resultadoIA ? Math.round(resultadoIA.confianca) : 0,
                usandoModeloReal: resultadoIA ? resultadoIA.usandoModeloReal : false,
                erroIA: resultadoIA ? resultadoIA.erro : 'Nenhuma imagem enviada'
            }
        };
        
        console.log(`📋 Apenas questionário: ${percentualQuestionario}%`);
    }
    
    return resultadoFinal;
}

// ==================== EXIBIÇÃO DE RESULTADOS ====================
function exibirResultadoCompleto(resultado) {
    const container = document.getElementById('resultado');
    
    // Determinar nível de risco e cor
    const { nivelRisco, cor, icone } = determinarNivelRisco(resultado.percentual);
    
    let html = `
        <h2>📊 Resultado da Triagem</h2>
        
        <div class="result-summary">
            <div class="risk-level ${nivelRisco.toLowerCase()}">
                <div class="risk-icon">${icone}</div>
                <h3 class="risk-title">Risco ${nivelRisco}</h3>
                <div class="risk-score" style="color: ${cor}">
                    ${resultado.percentual}%
                </div>
            </div>
            
            <div class="analysis-details">
                <h4>📋 Detalhes da Análise</h4>
                <div class="details-grid">
                    <div class="detail-item">
                        <span class="detail-label">Questionário:</span>
                        <span class="detail-value">${resultado.detalhes.questionario}%</span>
                    </div>`;
    
    if (resultado.usandoIA) {
        html += `
                    <div class="detail-item">
                        <span class="detail-label">Análise de Imagem:</span>
                        <span class="detail-value ${resultado.detalhes.classeIA === 'Positivo' ? 'positive' : 'negative'}">
                            ${resultado.detalhes.classeIA} (${resultado.detalhes.ia}%)
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Confiança da IA:</span>
                        <span class="detail-value">${resultado.detalhes.confiancaIA}%</span>
                    </div>`;
        
        if (!resultado.detalhes.usandoModeloReal) {
            html += `
                    <div class="detail-item warning">
                        <span class="detail-label">⚠️ Modo:</span>
                        <span class="detail-value">Simulação</span>
                    </div>`;
        }
    } else {
        html += `
                    <div class="detail-item">
                        <span class="detail-label">Análise de Imagem:</span>
                        <span class="detail-value">${resultado.detalhes.erroIA || 'Não realizada'}</span>
                    </div>`;
    }
    
    html += `
                    <div class="detail-item">
                        <span class="detail-label">Origem:</span>
                        <span class="detail-value">${resultado.origem === 'combinado' ? 'Combinação IA + Questionário' : 'Apenas Questionário'}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="chart-container">
            <canvas id="graficoPizza"></canvas>
        </div>
        
        <div id="orientacoes"></div>
        
        <div class="result-actions">
            <button onclick="mostrarEducacao()">📚 Mais sobre a doença</button>
            <a href="https://www.google.com/maps/search/ubs+mais+próxima/" target="_blank">
                <button class="btn-yellow">🏥 UBS mais próxima</button>
            </a>
            <button onclick="reiniciarTriagem()" class="btn-secondary">🔄 Nova Triagem</button>
        </div>
        
        <div class="disclaimer">
            <p><strong>⚠️ Atenção:</strong> Esta ferramenta é para triagem inicial apenas. 
            Não substitui avaliação médica presencial. Consulte um profissional de saúde.</p>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Exibir gráfico
    exibirGrafico(resultado);
    
    // Exibir orientações
    exibirOrientacoes(resultado.percentual, nivelRisco);
}

function determinarNivelRisco(percentual) {
    if (percentual >= 70) {
        return {
            nivelRisco: 'ALTO',
            cor: '#e53935',
            icone: '🚨'
        };
    } else if (percentual >= 40) {
        return {
            nivelRisco: 'MÉDIO',
            cor: '#fbc02d',
            icone: '⚠️'
        };
    } else {
        return {
            nivelRisco: 'BAIXO',
            cor: '#43a047',
            icone: '✅'
        };
    }
}

function exibirGrafico(resultado) {
    const ctx = document.getElementById('graficoPizza').getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (window.meuGrafico) {
        window.meuGrafico.destroy();
    }
    
    const dadosGrafico = [];
    const labels = [];
    const cores = [];
    
    if (resultado.origem === 'combinado') {
        // Gráfico de barras comparativo
        labels.push('Questionário', 'Análise IA', 'Resultado Final');
        dadosGrafico.push(
            resultado.detalhes.questionario,
            resultado.detalhes.ia,
            resultado.percentual
        );
        cores.push('#4DB6AC', '#FF9800', '#00796B');
        
        window.meuGrafico = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Percentual de Risco (%)',
                    data: dadosGrafico,
                    backgroundColor: cores,
                    borderColor: '#333',
                    borderWidth: 1,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${context.raw}%`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Percentual (%)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    } else {
        // Gráfico de pizza simples
        labels.push('Risco', 'Baixo Risco');
        dadosGrafico.push(resultado.percentual, 100 - resultado.percentual);
        cores.push(getCorRisco(resultado.percentual), '#e0e0e0');
        
        window.meuGrafico = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: dadosGrafico,
                    backgroundColor: cores,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.label}: ${context.raw}%`
                        }
                    }
                }
            }
        });
    }
}

function getCorRisco(percentual) {
    if (percentual >= 70) return '#e53935';
    if (percentual >= 40) return '#fbc02d';
    return '#43a047';
}

function exibirOrientacoes(percentual, nivelRisco) {
    let html = '<div class="orientacoes-box">';
    
    if (nivelRisco === 'ALTO') {
        html += `
            <h3 class="risco-alto">🚨 Recomendações para Risco ALTO</h3>
            <div class="orientacoes-content">
                <div class="orientacao-item urgente">
                    <strong>AÇÃO IMEDIATA:</strong>
                    <p>Procure atendimento médico URGENTE em uma Unidade Básica de Saúde (UBS).</p>
                </div>
                <div class="orientacao-item">
                    <strong>Não manipule a lesão:</strong>
                    <p>Evite tocar, coçar ou tentar tratar por conta própria.</p>
                </div>
                <div class="orientacao-item">
                    <strong>Documente:</strong>
                    <p>Registre fotos diárias para mostrar ao médico a evolução.</p>
                </div>
                <div class="orientacao-item">
                    <strong>Informe:</strong>
                    <p>Comunique se esteve em áreas de mata, floresta ou rural recentemente.</p>
                </div>
            </div>`;
    } else if (nivelRisco === 'MÉDIO') {
        html += `
            <h3 class="risco-medio">⚠️ Recomendações para Risco MÉDIO</h3>
            <div class="orientacoes-content">
                <div class="orientacao-item importante">
                    <strong>AVALIAÇÃO MÉDICA:</strong>
                    <p>Agende consulta médica para avaliação profissional.</p>
                </div>
                <div class="orientacao-item">
                    <strong>Monitoramento:</strong>
                    <p>Observe a lesão diariamente. Anote qualquer mudança.</p>
                </div>
                <div class="orientacao-item">
                    <strong>Proteção:</strong>
                    <p>Use repelente e roupas compridas em áreas de risco.</p>
                </div>
                <div class="orientacao-item">
                    <strong>Evite:</strong>
                    <p>Fique longe de áreas com mosquitos, especialmente ao amanhecer e entardecer.</p>
                </div>
            </div>`;
    } else {
        html += `
            <h3 class="risco-baixo">✅ Recomendações para Risco BAIXO</h3>
            <div class="orientacoes-content">
                <div class="orientacao-item tranquilo">
                    <strong>VIGILÂNCIA:</strong>
                    <p>Continue monitorando sua saúde regularmente.</p>
                </div>
                <div class="orientacao-item">
                    <strong>Prevenção:</strong>
                    <p>Mantenha hábitos de proteção contra insetos.</p>
                </div>
                <div class="orientacao-item">
                    <strong>Atenção:</strong>
                    <p>Procure médico se surgirem novos sintomas ou mudanças.</p>
                </div>
                <div class="orientacao-item">
                    <strong>Informação:</strong>
                    <p>Conheça os sintomas da leishmaniose para identificar precocemente.</p>
                </div>
            </div>`;
    }
    
    html += `
        <div class="prevencao-tips">
            <h4>🛡️ Dicas de Prevenção</h4>
            <ul>
                <li>Use telas em portas e janelas</li>
                <li>Aplique repelente regularmente</li>
                <li>Evite áreas de mata ao amanhecer e entardecer</li>
                <li>Use roupas compridas claras em áreas de risco</li>
                <li>Mantenha o ambiente limpo e sem acúmulo de matéria orgânica</li>
            </ul>
        </div>
    </div>`;
    
    document.getElementById('orientacoes').innerHTML = html;
}

// ==================== FUNÇÕES UTILITÁRIAS ====================
function reiniciarTriagem() {
    // Reiniciar variáveis
    pagina = 0;
    respostas.length = 0;
    
    // Esconder todas as divs
    const divs = ["tcle", "resumo", "dados", "questionario", "foto", "resultado", "educacao", "final"];
    divs.forEach(div => {
        document.getElementById(div).classList.add("hidden");
    });
    
    // Mostrar primeira página
    document.getElementById("tcle").classList.remove("hidden");
    
    // Limpar inputs
    document.getElementById('imagem').value = '';
    
    console.log('🔄 Triagem reiniciada');
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 LeishCheck inicializando...');
    
    // Verificar se estamos em servidor local ou file://
    const protocolo = window.location.protocol;
    console.log(`🌐 Protocolo: ${protocolo}`);
    
    if (protocolo === 'file:') {
        console.warn('⚠️ Executando localmente (file://). Alguns recursos podem não funcionar.');
        console.warn('💡 Dica: Execute em um servidor HTTP (python -m http.server 8000)');
    }
    
    // Iniciar carregamento do modelo em background
    setTimeout(() => {
        carregarModeloTFJS().then(sucesso => {
            if (!sucesso) {
                console.warn('Modelo não carregado, usando funcionalidades básicas');
            }
        });
    }, 1000);
    
    // Adicionar estilos dinâmicos
    adicionarEstilosDinamicos();
});

function adicionarEstilosDinamicos() {
    const style = document.createElement('style');
    style.textContent = `
        .model-status {
            padding: 12px;
            margin: 15px 0;
            border-radius: 10px;
            text-align: center;
            font-weight: bold;
        }
        
        .model-status.success {
            background-color: #d4edda;
            color: #155724;
            border: 2px solid #c3e6cb;
        }
        
        .model-status.warning {
            background-color: #fff3cd;
            color: #856404;
            border: 2px solid #ffeaa7;
        }
        
        .model-status.error {
            background-color: #f8d7da;
            color: #721c24;
            border: 2px solid #f5c6cb;
        }
        
        .loading {
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        
        .loading::after {
            content: '';
            width: 16px;
            height: 16px;
            border: 2px solid #fff;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .risk-level {
            text-align: center;
            padding: 20px;
            border-radius: 15px;
            margin-bottom: 20px;
        }
        
        .risk-level.alto {
            background-color: #ffebee;
            border: 3px solid #e53935;
        }
        
        .risk-level.medio {
            background-color: #fff8e1;
            border: 3px solid #fbc02d;
        }
        
        .risk-level.baixo {
            background-color: #e8f5e9;
            border: 3px solid #43a047;
        }
        
        .risk-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        
        .risk-title {
            margin: 10px 0;
            font-size: 24px;
        }
        
        .risk-score {
            font-size: 56px;
            font-weight: bold;
            margin: 15px 0;
        }
        
        .details-grid {
            display: grid;
            gap: 10px;
            margin-top: 15px;
        }
        
        .detail-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        
        .detail-item:last-child {
            border-bottom: none;
        }
        
        .detail-label {
            font-weight: 500;
            color: #555;
        }
        
        .detail-value {
            font-weight: 600;
        }
        
        .detail-value.positive {
            color: #e53935;
        }
        
        .detail-value.negative {
            color: #43a047;
        }
        
        .detail-item.warning {
            background-color: #fff3cd;
            padding: 8px;
            border-radius: 5px;
        }
        
        .orientacoes-content {
            margin: 20px 0;
        }
        
        .orientacao-item {
            padding: 12px;
            margin: 10px 0;
            background-color: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #00796B;
        }
        
        .orientacao-item.urgente {
            border-left-color: #e53935;
            background-color: #ffebee;
        }
        
        .orientacao-item.importante {
            border-left-color: #fbc02d;
            background-color: #fff8e1;
        }
        
        .orientacao-item.tranquilo {
            border-left-color: #43a047;
            background-color: #e8f5e9;
        }
        
        .prevencao-tips {
            margin-top: 25px;
            padding: 15px;
            background-color: #e3f2fd;
            border-radius: 10px;
        }
        
        .prevencao-tips ul {
            margin: 10px 0 0 20px;
        }
        
        .prevencao-tips li {
            margin: 5px 0;
        }
        
        .btn-secondary {
            background-color: #757575;
        }
        
        .btn-secondary:hover {
            background-color: #616161;
        }
    `;
    
    document.head.appendChild(style);
}
