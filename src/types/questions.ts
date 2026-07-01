export type QuestionType = 'multiple-choice' | 'true-false' | 'alternative' | 'text-input' | 'table-fill' | 'fill-blanks' | 'ordering';

export interface MultipleChoiceQuestion {
  id: string;
  type: 'multiple-choice';
  question: string;
  number?: number;
  options: {
    a: string;
    b: string;
    c: string;
  };
  correctAnswer: 'a' | 'b' | 'c';
}

export interface TrueFalseQuestion {
  id: string;
  type: 'true-false';
  question: string;
  correctAnswer?: boolean; // Para compatibilidade com formato antigo (opcional quando há statements)
  number?: number; // Número da questão (ex: 2, 3, 4...)
  statements?: Array<{
    letter: string; // Letra da afirmação (ex: 'a', 'b', 'c')
    statement: string; // Texto da afirmação
    correctAnswer: boolean; // Se a afirmação é verdadeira ou falsa
    correction?: string; // Correção para afirmações falsas (opcional)
  }>;
  hasCorrectionBox?: boolean; // Se deve mostrar campo de texto para correções
  correctionPlaceholder?: string; // Placeholder para o campo de correção
}

export interface AlternativeQuestion {
  id: string;
  type: 'alternative';
  question: string;
  options: string[];
  correctAnswer: number;
  number?: number; // Número da questão (ex: 3, 4, 5...)
}

export interface TextInputQuestion {
  id: string;
  type: 'text-input';
  question: string;
  /** Se true, pergunta + campo ficam dentro de ul.list-disc (bullet roxo #80298F), como no livro impresso */
  listDiscLayout?: boolean;
  placeholder?: string;
  correctAnswer?: string; // Opcional, para validação na visão do professor
  number?: number; // Número da questão (ex: 1, 2, 3...)
  subQuestions?: Array<{
    letter: string; // Letra da subquestão (ex: 'a', 'b', 'c')
    question: string; // Texto da subquestão
    placeholder?: string;
    correctAnswer?: string;
    subItems?: Array<{
      label: string; // Rótulo da subquestão aninhada (ex: 'Situação inicial', 'Conflito', 'Desfecho')
      placeholder?: string;
      correctAnswer?: string;
    }>;
  }>;
  embeddedContent?: string; // Conteúdo a ser exibido em uma caixa (ex: versos do poema)
  embeddedContentMaxWidth?: string; // Largura máxima do conteúdo embutido (ex: '400px', '50%', 'fit-content')
  followUpQuestion?: string; // Pergunta adicional com bullet vermelho
}

export interface TableFillQuestion {
  id: string;
  type: 'table-fill';
  question?: string;
  number?: number;
  columns: string[];
  rows: Array<{
    id: string;
    [key: string]: string | undefined; // Permite campos dinâmicos: o primeiro campo corresponde à primeira coluna, os demais às outras colunas
  }>;
  correctAnswer?: {
    [fieldId: string]: string; // Mapeia fieldId (questionId_rowId_colN) para a resposta correta
  };
  subQuestions?: Array<{
    letter: string; // Letra da subquestão (ex: 'a', 'b', 'c')
    question: string; // Texto da subquestão
    placeholder?: string;
    correctAnswer?: string;
  }>;
}

export interface FillBlanksQuestion {
  id: string;
  type: 'fill-blanks';
  number?: number;
  question: string;
  items: Array<{
    letter: string; // Letra do item (ex: 'a', 'b', 'c')
    fragments: string[]; // Texto quebrado por lacunas. Ex: ["A troca ... de ", "."]
    placeholders?: string[]; // Placeholder por lacuna
    correctAnswers?: string[]; // Resposta esperada por lacuna (visão do professor)
  }>;
}

export interface OrderingQuestion {
  id: string;
  type: 'ordering';
  number?: number;
  question: string;
  items: Array<{
    id: string;
    text: string;
    correctOrder: number;
  }>;
}

export type Question =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | AlternativeQuestion
  | TextInputQuestion
  | TableFillQuestion
  | FillBlanksQuestion
  | OrderingQuestion;

export interface UserAnswers {
  [questionId: string]: string | number | boolean;
}

export interface QuestionResult {
  questionId: string;
  userAnswer: string | number | boolean | undefined;
  correctAnswer: string | number | boolean;
  isCorrect: boolean;
}
