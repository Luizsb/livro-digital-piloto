import { Question, UserAnswers } from '@book/types/questions';
import QuestionTrueFalse from '@book/components/QuestionTrueFalse';
import QuestionAlternative from '@book/components/QuestionAlternative';
import QuestionTextInput from '@book/components/QuestionTextInput';
import QuestionTableFill from '@book/components/QuestionTableFill';
import QuestionFillBlanks from '@book/components/QuestionFillBlanks';
import QuestionOrdering from '@book/components/QuestionOrdering';
import QuestionMultipleChoice from '@book/components/QuestionMultipleChoice';

interface QuestionRendererProps {
  question?: Question;
  userAnswers: UserAnswers;
  onAnswerChange: (questionId: string, answer: any) => void;
  showResults?: boolean;
}

function QuestionRenderer({
  question,
  userAnswers,
  onAnswerChange,
  showResults = false,
}: QuestionRendererProps) {
  if (!question) {
    return null;
  }

  switch (question.type) {
    case 'multiple-choice':
      return (
        <QuestionMultipleChoice
          question={question}
          userAnswers={userAnswers}
          onAnswerChange={onAnswerChange}
          showResults={showResults}
        />
      );
    case 'true-false':
      return (
        <QuestionTrueFalse
          question={question}
          userAnswers={userAnswers}
          onAnswerChange={onAnswerChange}
          showResults={showResults}
        />
      );
    case 'alternative':
      return (
        <QuestionAlternative
          question={question}
          userAnswers={userAnswers}
          onAnswerChange={onAnswerChange}
          showResults={showResults}
        />
      );
    case 'text-input':
      return (
        <QuestionTextInput
          question={question}
          userAnswers={userAnswers}
          onAnswerChange={onAnswerChange}
          showResults={showResults}
        />
      );
    case 'table-fill':
      return (
        <QuestionTableFill
          questionId={question.id}
          title={question.question}
          number={question.number}
          columns={question.columns}
          rows={question.rows}
          subQuestions={question.subQuestions}
          userAnswers={userAnswers}
          onAnswerChange={(_questionId, fieldId, answer) => onAnswerChange(fieldId, answer)}
          showResults={showResults}
        />
      );
    case 'fill-blanks':
      return (
        <QuestionFillBlanks
          question={question}
          userAnswers={userAnswers}
          onAnswerChange={onAnswerChange}
          showResults={showResults}
        />
      );
    case 'ordering':
      return (
        <QuestionOrdering
          question={question}
          userAnswers={userAnswers}
          onAnswerChange={onAnswerChange}
          showResults={showResults}
        />
      );
    default:
      return null;
  }
}

export default QuestionRenderer;

