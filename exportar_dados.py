# exportar_dados.py
import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
from datetime import datetime
import json

# 1. CONFIGURAR CREDENCIAL
# Coloque o arquivo JSON que você baixou na mesma pasta deste script
cred = credentials.Certificate("credencial-firebase.json")
firebase_admin.initialize_app(cred)

# 2. CONECTAR AO FIREBASE
db = firestore.client()

# 3. BUSCAR TODOS OS USUÁRIOS
print("📊 Buscando dados do Firebase...")
usuarios_ref = db.collection('usuarios')
docs = usuarios_ref.stream()

# 4. ORGANIZAR DADOS
dados = []
for doc in docs:
    try:
        data = doc.to_dict()
        data['id'] = doc.id
        
        # Converter timestamp do Firebase para string
        if 'timestamp' in data:
            timestamp = data['timestamp']
            if hasattr(timestamp, 'isoformat'):
                data['timestamp'] = timestamp.isoformat()
        
        dados.append(data)
        print(f"✅ Processado: {doc.id}")
        
    except Exception as e:
        print(f"❌ Erro no documento {doc.id}: {e}")

# 5. VERIFICAR SE TEM DADOS
if not dados:
    print("⚠️ Nenhum dado encontrado!")
    exit()

# 6. CRIAR TABELA EXCEL
print(f"📈 Encontrados {len(dados)} registros. Criando Excel...")

df = pd.DataFrame(dados)

# Nome do arquivo com data/hora
data_hora = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
nome_arquivo = f"relatorio_leishcheck_{data_hora}.xlsx"

# Salvar em Excel
df.to_excel(nome_arquivo, index=False, engine='openpyxl')

print(f"🎉 Relatório salvo como: {nome_arquivo}")
print(f"📁 Total de registros: {len(dados)}")

# 7. MOSTRAR RESUMO
print("\n📋 RESUMO DOS DADOS:")
print(f"- Idades: {df['idade'].unique()[:5]}...")
print(f"- Cidades: {df['cidade'].unique()[:5]}...")
print(f"- Risco Alto: {(df['resultado'].apply(lambda x: x.get('nivelRisco', '') == 'ALTO')).sum()}")
print(f"- Risco Médio: {(df['resultado'].apply(lambda x: x.get('nivelRisco', '') == 'MÉDIO')).sum()}")
print(f"- Risco Baixo: {(df['resultado'].apply(lambda x: x.get('nivelRisco', '') == 'BAIXO')).sum()}")
print(f"- Com imagem: {df['imagemURL'].notna().sum()}")