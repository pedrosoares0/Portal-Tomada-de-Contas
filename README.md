![Capa](https://github.com/pedrosoares0/Portal-Tomada-de-Contas/blob/main/imagens/capa-readme.png?raw=true)

# 📋 Portal de Tomada de Contas

O **Portal de Tomada de Contas** centraliza num único lugar tudo que o setor precisava buscar manualmente no SACC, no SEI e no DATACAR. Convênios, demandas, viagens, vencimentos, notificações do TCE. Tudo ali, organizado, acessível e claro.

---

## O problema

O setor de Tomada de Contas da CAR trabalhava com três sistemas que não conversavam entre si:

- **SACC** — sistema interno com dados de convênios e associações
- **SEI** — plataforma de processos do governo estadual
- **DATACAR** — base de dados institucional da empresa

Qualquer pesquisa simples virava um processo manual: abrir um app, copiar dado, abrir outro, cruzar informação, abrir o terceiro, confirmar. Tempo desperdiçado, margem pra erro, e nenhuma visão consolidada do trabalho.

---

## A solução

Um portal web centralizado onde cada colaborador entra e vê:

- 📊 **Dados do setor** atualizados
- ⏰ **Prazos em atenção** — com alertas visuais para vencimentos críticos
- 📬 **Notificações do TCE** (Tribunal de Contas do Estado)
- 🗺️ **Mapa de tomadas por município** — visão geográfica da distribuição
- ✈️ **Relação de viagens** do colaborador
- 📁 **Portarias e ofícios** centralizados
- 👥 **Comissões** e responsáveis por processo

Sem precisar saber em qual dos três sistemas aquela informação estava.

---

## Como funciona por baixo

```text
SACC ─────┐
SEI ──────┼──▶ APIs + Automações ──▶ Portal 
DATACAR ──┘     + Database local
```

- Integração via **API** com SACC e DATACAR
- **Automações** para sincronização de dados entre sistemas
- **Database próprio** com os registros de tomada de contas da empresa
- Interface construída em **HTML, CSS e JavaScript**
- Em transição para **React** (em breve)

---

## Status
🟡 Em fase de testes internos
🔜 Migração para React planejada
✅ Já em uso pelo setor de Tomada de Contas da CAR/BA

---

## Stack

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![React](https://img.shields.io/badge/React-em_breve-61DAFB?style=flat&logo=react&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)

---

## Contexto

Projeto desenvolvido internamente para empresa vinculada ao Governo do Estado da Bahia. O objetivo foi reduzir o tempo de pesquisa do colaborador, centralizar informações antes disperças e dar visibilidade consolidada às demandas do setor.

> [!IMPORTANT]  
> Por questões de segurança e presença de **informações sensíveis** (dados de convênios, nomes e documentos), não serão exibidas fotos detalhadas das telas internas do sistema além da capa.

---
