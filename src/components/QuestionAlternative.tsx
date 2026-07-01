import { AlternativeQuestion, UserAnswers } from '../types/questions';
import { QuestionWrapper } from './shared/QuestionWrapper';
import { COLORS, FONTS } from '../constants/colors';

interface QuestionAlternativeProps {
  question: AlternativeQuestion;
  userAnswers: UserAnswers;
  onAnswerChange: (questionId: string, answer: number) => void;
  showResults?: boolean;
}

function QuestionAlternative({
  question,
  userAnswers,
  onAnswerChange,
  showResults = false,
}: QuestionAlternativeProps) {
  const selectedAnswer = userAnswers[question.id];
  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <QuestionWrapper
      number={question.number}
      question={question.question}
      className="p-4 rounded-lg"
    >
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <label
            key={index}
            className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors ${
              selectedAnswer === index
                ? 'bg-blue-100 border-l-4 border-blue-600'
                : 'bg-white hover:bg-blue-50'
            } ${
              showResults && selectedAnswer === index
                ? isCorrect
                  ? 'border-l-4 border-green-600 bg-green-50'
                  : 'border-l-4 border-red-600 bg-red-50'
                : ''
            }`}
          >
            <input
              type="radio"
              name={question.id}
              value={index}
              checked={selectedAnswer === index}
              onChange={() => onAnswerChange(question.id, index)}
              className="w-4 h-4"
              disabled={showResults}
            />
            <span style={{ fontFamily: FONTS.primary, color: COLORS.text.primary }}>
              <span style={{ color: COLORS.primary, fontWeight: 'bold' }}>
                {String.fromCharCode(97 + index)}){' '}
              </span>
              {option}
            </span>
            {showResults && selectedAnswer === index && (
              <span className={`ml-auto text-sm font-semibold ${
                isCorrect ? 'text-green-600' : 'text-red-600'
              }`}>
                {isCorrect ? '✓ Correto' : '✗ Incorreto'}
              </span>
            )}
          </label>
        ))}
      </div>
      {showResults && selectedAnswer !== question.correctAnswer && (
        <p className="mt-3 text-sm text-red-600">
          Resposta correta: <strong>{question.options[question.correctAnswer]}</strong>
        </p>
      )}
    </QuestionWrapper>
  );
}

export default QuestionAlternative;
