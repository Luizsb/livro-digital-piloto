import { OrderingQuestion, UserAnswers } from '../types/questions';

interface QuestionOrderingProps {
  question: OrderingQuestion;
  userAnswers: UserAnswers;
  onAnswerChange: (questionId: string, answer: string) => void;
  showResults?: boolean;
}

function QuestionOrdering({
  question,
  userAnswers,
  onAnswerChange,
  showResults = false,
}: QuestionOrderingProps) {
  return (
    <div className="mb-6">
      <p className="mb-4 text-black">
        {question.number !== undefined && (
          <span className="mr-2 font-bold text-[#80298F] align-top">
            {question.number}.
          </span>
        )}
        <span dangerouslySetInnerHTML={{ __html: question.question }} />
      </p>

      <ul className="list-none space-y-3 pl-10">
        {question.items.map((item) => {
          const fieldId = `${question.id}_${item.id}`;
          const typedValue = (userAnswers[fieldId] as string) || '';
          const value = showResults ? String(item.correctOrder) : typedValue;

          return (
            <li key={item.id} className="flex items-start gap-3 text-black">
              <input
                type="text"
                value={value}
                onChange={(e) => onAnswerChange(fieldId, e.target.value)}
                disabled={showResults}
                inputMode="numeric"
                maxLength={1}
                className="mt-[1px] h-8 w-8 rounded-[9px] border border-[#80298F] bg-[#FFFFFF] text-center text-[14px] font-semibold text-[#000000] focus:outline-none"
              />
              <span className="leading-8">{item.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default QuestionOrdering;
