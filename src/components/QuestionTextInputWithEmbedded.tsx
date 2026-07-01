import { TextInputQuestion, UserAnswers } from '../types/questions';

interface QuestionTextInputWithEmbeddedProps {
  question: TextInputQuestion;
  userAnswers: UserAnswers;
  onAnswerChange: (questionId: string, answer: string) => void;
  showResults?: boolean;
}

function QuestionTextInputWithEmbedded({
  question,
  userAnswers,
  onAnswerChange,
  showResults = false,
}: QuestionTextInputWithEmbeddedProps) {
  const userAnswer = (userAnswers[question.id] as string) || '';

  return (
    <div className="mb-6">
      {/* Título principal com número */}
      <p className="mb-4">
        {question.number !== undefined && (
          <span style={{ color: '#00776E', fontWeight: 'bold' }}>{question.number}. </span>
        )}
        <span style={{ color: 'black' }} dangerouslySetInnerHTML={{ __html: question.question }} />
      </p>

      {/* Conteúdo embutido (versos do poema) */}
      {question.embeddedContent && (
        <div
          className="mb-4 p-4"
          style={{
            border: '1px solid #00A99D',
            borderRadius: '4px',
            fontFamily: 'Ubuntu, sans-serif',
            color: 'black',
            whiteSpace: 'pre-line',
            ...(question.embeddedContentMaxWidth && {
              maxWidth: question.embeddedContentMaxWidth,
              width: question.embeddedContentMaxWidth === 'fit-content' ? 'fit-content' : 'auto',
            }),
          }}
        >
          {question.embeddedContent}
        </div>
      )}

      {/* Pergunta de acompanhamento com bullet vermelho */}
      {question.followUpQuestion && (
        <div className="mb-4">
          <ul className="mb-2 question-subitems" style={{ paddingLeft: '1.5rem', listStyleType: 'disc' }}>
            <li style={{ color: '#BF3154' }}>
              <span style={{ color: 'black' }}>{question.followUpQuestion}</span>
            </li>
          </ul>
        </div>
      )}

      {/* Campo de texto para resposta */}
      <textarea
        value={userAnswer}
        onChange={(e) => onAnswerChange(question.id, e.target.value)}
        placeholder={question.placeholder || 'Digite sua resposta aqui...'}
        disabled={showResults}
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[100px] text-black"
        style={{
          fontFamily: 'inherit',
        }}
      />

      {/* Resposta esperada (visão do professor) */}
      {showResults && question.correctAnswer && (
        <div className="mt-3 p-3 bg-gray-100 rounded">
          <p className="text-sm font-semibold text-gray-700 mb-1">Resposta esperada:</p>
          <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: question.correctAnswer }} />
        </div>
      )}
    </div>
  );
}

export default QuestionTextInputWithEmbedded;

