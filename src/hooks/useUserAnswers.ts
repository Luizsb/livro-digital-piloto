import { useState, useEffect, useCallback } from 'react';
import { UserAnswers } from '../types/questions';
import { loadAnswers, saveAnswers } from '../utils/storage';

/**
 * Hook customizado para gerenciar respostas do usuário
 */
export function useUserAnswers() {
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});

  useEffect(() => {
    setUserAnswers(loadAnswers());
  }, []);

  const handleAnswerChange = useCallback((questionId: string, answer: any) => {
    const updatedAnswers = {
      ...userAnswers,
      [questionId]: answer,
    };
    setUserAnswers(updatedAnswers);
    saveAnswers(updatedAnswers);
  }, [userAnswers]);

  return {
    userAnswers,
    handleAnswerChange,
    setUserAnswers,
  };
}

