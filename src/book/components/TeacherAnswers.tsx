import { Question } from '@book/types/questions';
import { renderQuestionAnswer } from '@shared/utils/questionHelpers';

interface TeacherAnswersProps {
  questions: Question | Question[];
}

/**
 * Componente para renderizar respostas do professor
 * Elimina código repetido do Book.tsx
 */
export function TeacherAnswers({ questions }: TeacherAnswersProps) {
  const questionsArray = Array.isArray(questions) ? questions : [questions];
  const validQuestions = questionsArray.filter((q): q is Question => q !== undefined && q !== null);
  
  if (validQuestions.length === 0) {
    return null;
  }
  
  return (
    <>
      <p className="mb-3">Respostas:</p>
      {validQuestions.map((question) => (
        <div key={question.id}>
          {renderQuestionAnswer(question)}
        </div>
      ))}
    </>
  );
}

