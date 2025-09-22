import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';

import { TopAppBar } from '@/src/components/ui/TopAppBar';
import { Button } from '@/src/components/ui/Button';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { getLessonById, saveProgress, getProgress, getQuizByLessonId } from '@/src/db/index';
import { Platform } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/src/config/theme';
import { logger } from '@/src/utils/logger';

interface Question {
  question: string;
  options: string[];
  correct: number;
}

interface QuizData {
  id: number;
  lesson_id: number;
  title: string;
  questions: Question[];
}

export default function QuizScreen() {
  const { quizId } = useLocalSearchParams();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [lesson, setLesson] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadQuizData = async () => {
    const timer = logger.startTimer('Load quiz data');
    try {
      setLoading(true);
      logger.db.query('quiz', `Loading quiz data for quiz ID: ${quizId}`);

      // Use the unified database interface
      const quizData = await getQuizByLessonId(Number(quizId));
      
      if (quizData) {
        const lessonData = await getLessonById(quizData.lesson_id);
        const parsedQuestions = typeof quizData.questions === 'string' 
          ? JSON.parse(quizData.questions) 
          : quizData.questions;
        
        setQuiz({
          ...quizData,
          questions: parsedQuestions
        });
        setLesson(lessonData);
        setSelectedAnswers(new Array(parsedQuestions.length).fill(-1));

        timer();
        logger.db.query('quiz', `Quiz loaded: ${quizData.title || 'Unknown'}, ${parsedQuestions.length} questions, Lesson: ${lessonData?.title || 'Unknown'}`);
      } else {
        timer();
        logger.db.error('quiz_load', `Quiz not found for ID: ${quizId}`);
      }
    } catch (error) {
      timer();
      logger.db.error('quiz_load', `Failed to load quiz ${quizId}: ${error.message}`);
      console.error('Error loading quiz data:', error);
      Alert.alert('Error', 'Failed to load quiz data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quizId) {
      loadQuizData();
    }
  }, [quizId]);

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;

    const timer = logger.startTimer('Submit quiz');
    let correctAnswers = 0;
    quiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct) {
        correctAnswers++;
      }
    });

    const finalScore = Math.round((correctAnswers / quiz.questions.length) * 100);
    setScore(finalScore);
    setShowResults(true);

    logger.db.query('quiz', `Quiz completed: ${correctAnswers}/${quiz.questions.length} correct (${finalScore}%)`);

    try {
      await saveProgress(quiz.lesson_id, quiz.id, finalScore, true);
      timer();
      logger.db.query('progress', `Successfully saved quiz progress: Lesson ${quiz.lesson_id}, Quiz ${quiz.id}, Score ${finalScore}%`);
    } catch (error) {
      timer();
      logger.db.error('progress_save', `Failed to save quiz progress: ${error.message}`);
      console.error('Error saving quiz progress:', error);
      Alert.alert('Warning', 'Quiz completed but progress could not be saved.');
    }
  };

  const handleRetakeQuiz = () => {
    logger.db.query('quiz', `Retaking quiz: ${quiz?.title || 'Unknown'}`);
    setCurrentQuestionIndex(0);
    setSelectedAnswers(new Array(quiz?.questions.length || 0).fill(-1));
    setShowResults(false);
    setScore(0);
  };

  const handleBackToLesson = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <TopAppBar
          title="Loading..."
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading quiz...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!quiz) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <TopAppBar
          title="Quiz"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Quiz not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showResults) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <TopAppBar
          title="Quiz Results"
          showBackButton
          onBackPress={() => router.back()}
        />
        <ScrollView style={styles.content}>
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Quiz Completed!</Text>
            <Text style={styles.scoreText}>Your Score: {score}%</Text>
            
            <View style={styles.scoreBreakdown}>
              <Text style={styles.breakdownText}>
                {quiz.questions.filter((_, index) => selectedAnswers[index] === quiz.questions[index].correct).length} out of {quiz.questions.length} correct
              </Text>
            </View>

            <View style={styles.resultsSummary}>
              {quiz.questions.map((question, index) => (
                <View key={index} style={styles.questionResult}>
                  <Text style={styles.questionNumber}>Question {index + 1}</Text>
                  <Text style={styles.questionText}>{question.question}</Text>
                  <Text style={[
                    styles.answerResult,
                    selectedAnswers[index] === question.correct ? styles.correctAnswer : styles.incorrectAnswer
                  ]}>
                    Your answer: {question.options[selectedAnswers[index]]}
                    {selectedAnswers[index] !== question.correct && (
                      <>
                        {'\n'}Correct answer: {question.options[question.correct]}
                      </>
                    )}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.resultsActions}>
              <Button
                title="Retake Quiz"
                onPress={handleRetakeQuiz}
                variant="tertiary"
                style={styles.actionButton}
              />
              <Button
                title="Back to Lesson"
                onPress={handleBackToLesson}
                style={styles.actionButton}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const hasSelectedAnswer = selectedAnswers[currentQuestionIndex] !== -1;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopAppBar
        title={quiz.title}
        showBackButton
        onBackPress={() => router.back()}
      />
      
      <View style={styles.quizContainer}>
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </Text>
          <ProgressBar progress={progress} style={styles.progressBar} />
        </View>

        <ScrollView style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedAnswers[currentQuestionIndex] === index && styles.selectedOption
                ]}
                onPress={() => handleAnswerSelect(index)}
                accessibilityLabel={`Option ${index + 1}: ${option}`}
                accessibilityRole="button"
              >
                <Text style={[
                  styles.optionText,
                  selectedAnswers[currentQuestionIndex] === index && styles.selectedOptionText
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.navigationSection}>
          <View style={styles.navigationButtons}>
            <Button
              title="Previous"
              onPress={handlePreviousQuestion}
              variant="tertiary"
              disabled={currentQuestionIndex === 0}
              style={[styles.navButton, { opacity: currentQuestionIndex === 0 ? 0.5 : 1 }]}
            />
            
            <Button
              title={isLastQuestion ? 'Submit Quiz' : 'Next'}
              onPress={handleNextQuestion}
              disabled={!hasSelectedAnswer}
              style={[styles.navButton, { opacity: hasSelectedAnswer ? 1 : 0.5 }]}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.body1,
    color: colors.error,
  },
  quizContainer: {
    flex: 1,
  },
  progressSection: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
  },
  questionContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  questionText: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
    lineHeight: 28,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  optionButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    minHeight: 44,
    justifyContent: 'center',
  },
  selectedOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    ...typography.body1,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  selectedOptionText: {
    color: colors.background,
    fontWeight: '600',
  },
  navigationSection: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  navButton: {
    flex: 1,
  },
  resultsContainer: {
    padding: spacing.lg,
  },
  resultsTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  scoreText: {
    ...typography.h1,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  scoreBreakdown: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  breakdownText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  resultsSummary: {
    marginBottom: spacing.xl,
  },
  questionResult: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  questionNumber: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  answerResult: {
    ...typography.body2,
    marginTop: spacing.sm,
  },
  correctAnswer: {
    color: colors.success,
  },
  incorrectAnswer: {
    color: colors.error,
  },
  resultsActions: {
    gap: spacing.md,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
});