import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/src/components/ui/Button';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { TopAppBar } from '@/src/components/ui/TopAppBar';
import { borderRadius, colors, spacing, typography } from '@/src/config/theme';
import { getLessonById, getQuizById } from '@/src/db/index';
import { offlineManager } from '@/src/services/offlineManager';
import { logger } from '@/src/utils/logger';

interface Question {
  question: string;
  options: string[];
  correct: number;
}

interface QuizData {
  id: string | number;
  lesson_id: string | number;
  title: string;
  questions: Question[];
}

interface Lesson {
  title?: string;
}

// Static sample quiz for fallback when Bubble data fails
const SAMPLE_QUIZ: QuizData = {
  id: 'sample-quiz',
  lesson_id: 'sample-lesson',
  title: 'AI Fundamentals Quiz (Demo)',
  questions: [
    {
      question: 'What does AI stand for in the context of technology?',
      options: ['Automated Intelligence', 'Artificial Intelligence', 'Advanced Interface', 'Algorithmic Innovation'],
      correct: 1
    },
    {
      question: 'Which of the following is a popular AI language model?',
      options: ['GPT', 'HTML', 'SQL', 'CSS'],
      correct: 0
    },
    {
      question: 'What is machine learning?',
      options: ['A type of computer hardware', 'A subset of AI that enables systems to learn from data', 'A programming language', 'A database management system'],
      correct: 1
    },
    {
      question: 'Which company developed ChatGPT?',
      options: ['Google', 'Microsoft', 'OpenAI', 'Meta'],
      correct: 2
    },
    {
      question: 'What is the primary purpose of neural networks in AI?',
      options: ['To store data', 'To mimic human brain function for pattern recognition', 'To create websites', 'To manage databases'],
      correct: 1
    }
  ]
};

export default function QuizScreen() {
  const { quizId } = useLocalSearchParams();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadQuizData = async () => {
    const timer = logger.startTimer('Load quiz data');
    try {
      setLoading(true);
      const quizIdStr = String(quizId);
      logger.db.query('quiz', `Loading quiz data for quiz ID: ${quizIdStr} (type: ${typeof quizId})`);
      console.log('[QUIZ DEBUG] Starting quiz load with ID:', quizIdStr, 'Original type:', typeof quizId);

      // Use the unified database interface
      // Important: Bubble IDs are strings; do not coerce to Number()
      const quizData = await getQuizById(quizIdStr);
      console.log('[QUIZ DEBUG] getQuizById returned:', quizData ? 'FOUND' : 'NULL', quizData ? JSON.stringify({id: quizData.id, title: quizData.title, lesson_id: quizData.lesson_id}) : 'N/A');

      if (quizData) {
        console.log('[QUIZ DEBUG] Quiz data exists, loading lesson...');
        const lessonData = await getLessonById(quizData.lesson_id);
        console.log('[QUIZ DEBUG] Lesson loaded:', lessonData ? lessonData.title : 'NULL');

        let parsedQuestions;
        try {
          parsedQuestions = typeof quizData.questions === 'string'
            ? JSON.parse(quizData.questions)
            : quizData.questions;
          console.log('[QUIZ DEBUG] Parsed questions count:', parsedQuestions?.length || 0);

          // Validate that we have a valid questions array
          if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
            throw new Error(`Invalid questions data: ${parsedQuestions ? typeof parsedQuestions : 'null'}`);
          }

          // Validate each question structure
          const invalidQuestions = parsedQuestions.filter((q, index) => {
            const isValid = q &&
              typeof q.question === 'string' &&
              Array.isArray(q.options) &&
              q.options.length > 0 &&
              typeof q.correct === 'number' &&
              q.correct >= 0 &&
              q.correct < q.options.length;

            if (!isValid) {
              console.error(`[QUIZ DEBUG] Invalid question at index ${index}:`, JSON.stringify(q));
            }
            return !isValid;
          });

          if (invalidQuestions.length > 0) {
            throw new Error(`Found ${invalidQuestions.length} invalid question(s) in quiz data`);
          }
        } catch (parseError) {
          timer();
          const errorMsg = `Failed to parse quiz questions: ${(parseError as any)?.message || parseError}`;
          logger.db.error('quiz_parse', errorMsg);
          console.error('[QUIZ DEBUG] Parse error:', parseError);
          console.error('[QUIZ DEBUG] Raw questions data:', quizData.questions);

          // Use sample quiz as fallback
          console.log('[QUIZ DEBUG] Using sample quiz as fallback');
          Alert.alert(
            'Using Sample Quiz',
            'The quiz data could not be loaded. Showing a sample quiz instead.',
            [{ text: 'OK' }]
          );

          setQuiz(SAMPLE_QUIZ);
          setLesson({ title: 'Sample Lesson' } as any);
          setSelectedAnswers(new Array(SAMPLE_QUIZ.questions.length).fill(-1));
          setLoading(false);
          return;
        }

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
        const errorMsg = `Quiz not found for ID: ${quizIdStr}`;
        logger.db.error('quiz_load', errorMsg);
        console.error('[QUIZ DEBUG] ' + errorMsg);

        // Use sample quiz as fallback
        console.log('[QUIZ DEBUG] Quiz not found, using sample quiz as fallback');
        Alert.alert(
          'Using Sample Quiz',
          'The requested quiz was not found. Showing a sample quiz instead.',
          [{ text: 'OK' }]
        );

        setQuiz(SAMPLE_QUIZ);
        setLesson({ title: 'Sample Lesson' } as any);
        setSelectedAnswers(new Array(SAMPLE_QUIZ.questions.length).fill(-1));
      }
    } catch (error) {
      timer();
      const errorMsg = `Failed to load quiz ${quizId}: ${(error as any)?.message || error}`;
      logger.db.error('quiz_load', errorMsg);
      console.error('[QUIZ DEBUG] Error:', error);
      console.error('[QUIZ DEBUG] Error stack:', (error as any)?.stack);

      // Use sample quiz as fallback for general errors
      console.log('[QUIZ DEBUG] General error occurred, using sample quiz as fallback');
      Alert.alert(
        'Using Sample Quiz',
        'An error occurred while loading the quiz. Showing a sample quiz instead.',
        [{ text: 'OK' }]
      );

      setQuiz(SAMPLE_QUIZ);
      setLesson({ title: 'Sample Lesson' } as any);
      setSelectedAnswers(new Array(SAMPLE_QUIZ.questions.length).fill(-1));
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
      // Safety check for question validity
      if (question && typeof question.correct === 'number' && selectedAnswers[index] === question.correct) {
        correctAnswers++;
      }
    });

    const finalScore = Math.round((correctAnswers / quiz.questions.length) * 100);
    setScore(finalScore);
    setShowResults(true);

    logger.db.query('quiz', `Quiz completed: ${correctAnswers}/${quiz.questions.length} correct (${finalScore}%)`);

    // Don't save progress for sample quiz
    if (quiz.id === 'sample-quiz') {
      timer();
      console.log('[QUIZ DEBUG] Sample quiz completed, not saving to database');
      return;
    }

    try {
  // Types in db may be narrower; cast to keep RN TS happy
  await offlineManager.saveUserProgress(String(quiz.lesson_id), String(quiz.id), finalScore, true);
      timer();
      logger.db.query('progress', `Successfully saved quiz progress: Lesson ${quiz.lesson_id}, Quiz ${quiz.id}, Score ${finalScore}%`);
    } catch (error) {
      timer();
  logger.db.error('progress_save', `Failed to save quiz progress: ${(error as any)?.message || error}`);
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

  const insets = useSafeAreaInsets();

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

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
  <SafeAreaView style={styles.container} edges={['bottom']}>
        <TopAppBar
          title="Quiz"
          showBackButton
          onBackPress={() => router.back()}
        />
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>Quiz not found or has no questions.</Text>
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
  <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.resultsContainer as any}>
            <Text style={styles.resultsTitle}>Quiz Completed!</Text>
            <Text style={styles.scoreText}>Your Score: {score}%</Text>
            
            <View style={styles.scoreBreakdown}>
              <Text style={styles.breakdownText}>
                {quiz.questions.filter((q, index) => q && selectedAnswers[index] === q.correct).length} out of {quiz.questions.length} correct
              </Text>
            </View>

            <View style={styles.resultsSummary}>
              {quiz.questions.map((question, index) => {
                // Safety check for each question
                if (!question || !Array.isArray(question.options)) {
                  return (
                    <View key={index} style={styles.questionResult}>
                      <Text style={styles.questionNumber}>Question {index + 1}</Text>
                      <Text style={styles.errorText}>Question data unavailable</Text>
                    </View>
                  );
                }

                const userAnswer = selectedAnswers[index];
                const userAnswerText = userAnswer >= 0 && userAnswer < question.options.length
                  ? question.options[userAnswer]
                  : 'No answer';
                const correctAnswerText = question.correct >= 0 && question.correct < question.options.length
                  ? question.options[question.correct]
                  : 'Unknown';

                return (
                  <View key={index} style={styles.questionResult}>
                    <Text style={styles.questionNumber}>Question {index + 1}</Text>
                    <Text style={styles.questionText}>{question.question || 'Question unavailable'}</Text>
                    <Text style={[
                      styles.answerResult,
                      userAnswer === question.correct ? styles.correctAnswer : styles.incorrectAnswer
                    ] as any}>
                      Your answer: {userAnswerText}
                      {userAnswer !== question.correct && (
                        <>
                          {'\n'}Correct answer: {correctAnswerText}
                        </>
                      )}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={[styles.resultsActions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
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

  // Safety check: if current question is invalid, show error
  if (!currentQuestion || !currentQuestion.options || !Array.isArray(currentQuestion.options)) {
    console.error('[QUIZ DEBUG] Invalid current question at index:', currentQuestionIndex);
    console.error('[QUIZ DEBUG] Current question data:', currentQuestion);
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <TopAppBar
          title="Quiz Error"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Question data is corrupted. Please go back and try again.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const hasSelectedAnswer = selectedAnswers[currentQuestionIndex] !== -1;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopAppBar
        title={quiz.title || `Quiz for Lesson ${lesson?.title || 'Unknown'}`}
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

        <ScrollView
          style={styles.questionScroll}
          contentContainerStyle={[styles.questionContainer, { paddingBottom: Math.max(insets.bottom + 8, 24) }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.questionText}>{currentQuestion.question}</Text>

          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedAnswers[currentQuestionIndex] === index && styles.selectedOption
                ] as any}
                onPress={() => handleAnswerSelect(index)}
                accessibilityLabel={`Option ${index + 1}: ${option}`}
                accessibilityRole="button"
              >
                <Text style={[
                  styles.optionText,
                  selectedAnswers[currentQuestionIndex] === index && styles.selectedOptionText
                ] as any}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

  <View style={[styles.navigationSection, { paddingTop: 8, paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
          <View style={styles.navigationButtons}>
            <Button
              title="Previous"
              onPress={handlePreviousQuestion}
              variant="secondary"
              disabled={currentQuestionIndex === 0}
              style={styles.navButton}
            />

            <Button
              title={isLastQuestion ? 'Submit Quiz' : 'Next'}
              onPress={handleNextQuestion}
              disabled={!hasSelectedAnswer}
              style={styles.navButton}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create<{ 
  container: ViewStyle; 
  content: ViewStyle; 
  loadingContainer: ViewStyle; 
  loadingText: TextStyle; 
  errorContainer: ViewStyle; 
  errorText: TextStyle; 
  quizContainer: ViewStyle; 
  progressSection: ViewStyle; 
  progressText: TextStyle; 
  progressBar: ViewStyle; 
  questionContainer: ViewStyle; 
  questionScroll: ViewStyle; 
  questionText: TextStyle; 
  optionsContainer: ViewStyle; 
  optionButton: ViewStyle; 
  selectedOption: ViewStyle; 
  optionText: TextStyle; 
  selectedOptionText: TextStyle; 
  navigationSection: ViewStyle; 
  navigationButtons: ViewStyle; 
  navButton: ViewStyle; 
  resultsContainer: ViewStyle; 
  resultsTitle: TextStyle; 
  scoreText: TextStyle; 
  scoreBreakdown: ViewStyle; 
  breakdownText: TextStyle; 
  resultsSummary: ViewStyle; 
  questionResult: ViewStyle; 
  questionNumber: TextStyle; 
  answerResult: TextStyle; 
  correctAnswer: TextStyle; 
  incorrectAnswer: TextStyle; 
  resultsActions: ViewStyle; 
  actionButton: ViewStyle; 
}>({
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
    ...(typography.body1 as any),
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...(typography.body1 as any),
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
    ...(typography.body2 as any),
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
  },
  questionScroll: {
    flex: 1,
  },
  questionContainer: {
    padding: spacing.lg,
  },
  questionText: {
    ...(typography.h3 as any),
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
    paddingVertical: spacing.xl,
    borderWidth: 2,
    borderColor: colors.border,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    ...(typography.body1 as any),
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
    flexWrap: 'wrap',
    textAlignVertical: 'center',
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
    minWidth: 100,
  },
  resultsContainer: {
    padding: spacing.lg,
  },
  resultsTitle: {
    ...(typography.h2 as any),
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  scoreText: {
    ...(typography.h1 as any),
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  scoreBreakdown: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  breakdownText: {
    ...(typography.body1 as any),
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
    ...(typography.body2 as any),
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  answerResult: {
    ...(typography.body2 as any),
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