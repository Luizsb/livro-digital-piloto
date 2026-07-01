import { ReactNode } from 'react';
import { QuestionNumber } from './QuestionNumber';
import { COLORS } from '../../constants/colors';

interface QuestionWrapperProps {
  number?: number;
  question: string;
  children?: ReactNode;
  className?: string;
  useHTML?: boolean;
}

/**
 * Componente wrapper reutilizável para questões
 */
export function QuestionWrapper({
  number,
  question,
  children,
  className = '',
  useHTML = false,
}: QuestionWrapperProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <p className="mb-4">
        <QuestionNumber number={number} />
        {useHTML ? (
          <span style={{ color: COLORS.text.primary }} dangerouslySetInnerHTML={{ __html: question }} />
        ) : (
          <span style={{ color: COLORS.text.primary }}>{question}</span>
        )}
      </p>
      {children}
    </div>
  );
}

