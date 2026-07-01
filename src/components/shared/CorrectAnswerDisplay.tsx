import { Question } from '../../types/questions';
import { renderQuestionAnswer } from '../../utils/questionHelpers';

interface CorrectAnswerDisplayProps {
  question: Question;
}

/**
 * Componente para exibir a resposta correta de uma questão
 */
export function CorrectAnswerDisplay({ question }: CorrectAnswerDisplayProps) {
  const answer = renderQuestionAnswer(question);
  
  if (!answer) {
    return null;
  }

  return (
    <div className="mb-3">
      {answer}
    </div>
  );
}

