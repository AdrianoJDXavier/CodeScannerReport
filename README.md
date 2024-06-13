# Code Scanner Report

Code Scanner Report é uma extensão para o Visual Studio Code que permite escanear todos os arquivos de um diretório em busca de `includes` duplicados, `console.log`, `echo`, `var_dump`, `print_r`, `rp_pre`, `rp_echo` e outros padrões especificados. Após a análise, um arquivo PDF é gerado com um relatório contendo o nome do arquivo, a linha e a ocorrência encontrada.

## Funcionalidades

- Escaneia arquivos PHP e JavaScript em um diretório especificado.
- Identifica e relata `includes` e `include_once` duplicados.
- Identifica e relata a presença de `console.log`, `echo`, `var_dump`, `print_r` e outras ocorrências especificadas.
- Gera um relatório em PDF com detalhes sobre cada ocorrência encontrada.

## Instalação

1. Vá para a extensão do Visual Studio Code.
2. Pesquise por `Code Scanner Report`.
3. Clique em `Instalar` para adicionar a extensão ao seu VS Code.

## Como Usar

1. Abra o diretório que você deseja escanear no VS Code.
2. Pressione `Ctrl+Alt+Z` (ou `Cmd+Alt+Z` no macOS) para iniciar o escaneamento dos arquivos.
Caso prefira ao clicar com o botão direito terá a opção **CodeScannerReport**

3. Um arquivo `report.pdf` será gerado no diretório raiz do seu workspace com o relatório do escaneamento.

## Atalhos de Teclado

- `Ctrl+Alt+Z` (Windows/Linux)
- `Cmd+Alt+Z` (macOS)

## Exemplo de Relatório

O relatório gerado em PDF inclui as seguintes informações para cada ocorrência encontrada:

- Nome do arquivo
- Número da linha
- Ocorrência (detalhes sobre o padrão encontrado)

```text
Arquivo: /caminho/para/o/arquivo.php, Linha: 10, Ocorrência: Include duplicado (include): include("globals/globals.php");
Arquivo: /caminho/para/o/arquivo.js, Linha: 20, Ocorrência: console.log("Teste");
