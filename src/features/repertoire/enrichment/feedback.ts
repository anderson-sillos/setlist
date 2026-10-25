export type EnrichmentFeedbackStage =
  | 'preparing'
  | 'searching'
  | 'ranking'
  | 'selecting'
  | 'duration-choice'
  | 'validating'
  | 'applying'
  | 'retry-wait'
  | 'empty'
  | 'failed'
  | 'completed';

const messages: Record<EnrichmentFeedbackStage, readonly string[]> = {
  preparing: [
    'Afinando a busca… hoje até o vizinho vai pedir bis.',
    'Preparando a pesquisa… o baterista jurou que já chega.',
    'Abrindo os trabalhos da busca… alguém viu o cabo da varinha?',
    'Passando o som da pesquisa… alô, um, dois, sofrência.',
    'Preparando a busca… a varinha pediu só um cafezinho.',
  ],
  searching: [
    'Procurando a música… até debaixo do tapete do camarim.',
    'Caçando essa música… mais difícil que achar palheta no palco.',
    'Buscando a faixa… sem mandar mensagem para o ex, por enquanto.',
    'Vasculhando o repertório… alguém deve lembrar além do “na-na-ná”.',
    'Procurando a faixa… antes que o tio do churrasco peça Evidências.',
  ],
  ranking: [
    'Comparando as versões… separando o original do primo que canta igual.',
    'Conferindo as gravações… até o “ao vivo” precisa mostrar documento.',
    'Comparando os resultados… sem confundir o bis com o remix do churrasco.',
    'Organizando as versões… cada gravação quer puxar o próprio solo.',
    'Conferindo os candidatos… o júri da sofrência está reunido.',
  ],
  selecting: [
    'A busca formou uma banda. Escolha a gravação que vai cantar com você.',
    'Tem versão querendo carreira solo. Escolha a que você procurava.',
    'O karaokê abriu audição. Escolha a gravação certa para o repertório.',
    'Qual dessas vai ganhar o bis? Toque na gravação que você quer.',
    'Agora o jurado é você. Escolha a gravação antes de soltar o gogó.',
  ],
  'duration-choice': [
    'O relógio desafinou: as durações diferem. Escolha como importar.',
    'Uma versão pediu bis no cronômetro. Escolha qual duração usar.',
    'Tem mais de um tempo nessa sofrência. Escolha como importar.',
    'Até o relógio quis fazer um solo. As durações diferem; escolha como seguir.',
    'O cronômetro e a gravação não combinaram o ensaio. Escolha a duração.',
  ],
  validating: [
    'Conferindo letra e tempos… vírgula fora do lugar também desafina.',
    'Checando os versos… para a sofrência não entrar antes da hora.',
    'Conferindo as marcações… até lágrima precisa entrar no compasso.',
    'Revisando letra e tempos… o fiscal do karaokê chegou.',
    'Checando a letra… o refrão não vai furar a fila dos versos.',
  ],
  applying: [
    'Preenchendo os campos… cada dado no seu quadrado e a dor no peito.',
    'Organizando o rascunho… para o refrão não morar na casa do artista.',
    'Preenchendo os campos… se a varinha pagasse boleto, era perfeição.',
    'Colocando os dados no lugar… desembaraçando tudo como cabo depois do show.',
    'Montando o rascunho… o resto do espetáculo fica por sua conta.',
  ],
  'retry-wait': [
    'A busca fez uma pausa dramática. Aguarde a próxima tentativa.',
    'O bis está no camarim. Aguarde a contagem para a próxima tentativa.',
    'O palco está mais concorrido que karaokê de firma. Aguarde a próxima tentativa.',
    'A varinha pediu um intervalo para o café. Aguarde a próxima tentativa.',
    'Até o solo precisa respirar. Aguarde a próxima tentativa da busca.',
  ],
  empty: [
    'Essa deu perdido igual palheta emprestada. Confira título e artista.',
    'Nem o tio do churrasco lembrou dessa. Confira título e artista.',
    'A música fez carreira solo e sumiu da busca. Revise título e artista.',
    'Essa escapou pela saída de emergência. Tente outro título ou artista.',
    'A busca ficou no “na-na-ná”. Nenhum resultado; confira título e artista.',
  ],
  failed: [
    'A busca tropeçou no cabo. Não foi possível concluir; tente novamente.',
    'O amplificador da pesquisa ficou mudo. Tente a busca novamente.',
    'A varinha desafinou no solo. Não foi possível concluir; tente novamente.',
    'O bis deu microfonia. A busca falhou; tente novamente.',
    'A pesquisa saiu do tom e pediu outra chance. Tente novamente.',
  ],
  completed: [
    'Essa é de arrastar o chifre no asfalto! Confere os campos antes de sofrer no tom errado.',
    'Encontramos! Confira os dados e avise o vizinho que hoje tem show.',
    'Busca concluída! Revise os campos; a terapia em forma de refrão é com você.',
    'Tá na mão! Confere o rascunho antes de soltar a voz e prender o choro.',
    'Busca afinada! Confira os campos. O refrão é da música; a indireta é por sua conta.',
    'Essa é massa! Confere os campos e prepara o gogó: o próximo bis já tem candidata.',
    'Classicão! Confere os dados antes de pôr três gerações para cantar junto.',
    'Essa é pedrada! Confira o rascunho antes de testar a resistência do telhado.',
    'Essa merece air guitar até com vassoura! Revise os campos antes do solo.',
    'Essa tira até o tímido da cadeira! Confere os dados antes de puxar o coro.',
  ],
};

export function chooseEnrichmentFeedback(
  stage: EnrichmentFeedbackStage,
  previousMessage?: string,
  random: () => number = Math.random,
): string {
  const options = messages[stage];
  const eligible = options.filter((message) => message !== previousMessage);
  const selectedOptions = eligible.length > 0 ? eligible : options;
  const randomIndex = Math.min(
    selectedOptions.length - 1,
    Math.max(0, Math.floor(random() * selectedOptions.length)),
  );
  return selectedOptions[randomIndex]!;
}
