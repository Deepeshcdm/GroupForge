import { useState } from 'react';
import { DashboardLayout } from '../components/layout';
import { Card, CardBody, CardHeader, Button } from '../components/ui';
import { useAssessment, useAuth } from '../contexts';
import { AssessmentType } from '../types';
import {
    ClipboardCheck,
    Brain,
    Users,
    Lightbulb,
    ArrowRight,
    Clock,
    CheckCircle2,
    Loader2
} from 'lucide-react';

export function AssessmentPage() {
    const { currentSession, isAssessing, startAssessment, submitResponse, completeAssessment, abandonAssessment } = useAssessment();
    useAuth();
    const [selectedType, setSelectedType] = useState<AssessmentType>('initial_screening');
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);

    const assessmentTypes: { type: AssessmentType; title: string; description: string; icon: any; duration: string }[] = [
        {
            type: 'initial_screening',
            title: 'Initial Screening',
            description: 'Quick evaluation across all skill dimensions',
            icon: ClipboardCheck,
            duration: '10-15 min',
        },
        {
            type: 'leadership_deep_dive',
            title: 'Leadership Deep Dive',
            description: 'In-depth assessment of leadership capabilities',
            icon: Users,
            duration: '15-20 min',
        },
        {
            type: 'technical_evaluation',
            title: 'Technical Evaluation',
            description: 'Analytical and problem-solving assessment',
            icon: Brain,
            duration: '15-20 min',
        },
        {
            type: 'creativity_assessment',
            title: 'Creativity Assessment',
            description: 'Evaluate creative thinking and innovation',
            icon: Lightbulb,
            duration: '10-15 min',
        },
    ];

    const handleStart = async () => {
        await startAssessment(selectedType);
        setStartTime(new Date());
    };

    const handleSubmitAnswer = async () => {
        if (!currentSession || !currentAnswer.trim()) return;

        setIsSubmitting(true);
        const currentQuestion = currentSession.questions[currentSession.currentQuestionIndex];

        const response = {
            questionId: currentQuestion.id,
            response: currentAnswer,
            timeTaken: startTime ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000) : 0,
            timestamp: new Date(),
        };

        const nextQuestion = await submitResponse(response);
        setCurrentAnswer('');
        setStartTime(new Date());
        setIsSubmitting(false);

        // If no more questions, complete the assessment
        if (!nextQuestion && currentSession.responses.length >= 5) {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        setIsCompleting(true);
        await completeAssessment();
        setIsCompleting(false);
    };

    // Assessment selection screen
    if (!isAssessing && !currentSession) {
        return (
            <DashboardLayout>
                <div className="max-w-4xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Skill Assessment</h1>
                        <p className="text-gray-500 mt-1">
                            Complete an AI-powered assessment to evaluate your skills and enable intelligent team matching.
                        </p>
                    </div>

                    <div className="grid gap-4">
                        {assessmentTypes.map((assessment) => {
                            const Icon = assessment.icon;
                            const isSelected = selectedType === assessment.type;

                            return (
                                <Card
                                    key={assessment.type}
                                    hover
                                    onClick={() => setSelectedType(assessment.type)}
                                    className={isSelected ? 'ring-2 ring-primary-500' : ''}
                                >
                                    <CardBody className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isSelected ? 'bg-primary-600' : 'bg-gray-100'
                                            }`}>
                                            <Icon className={`w-7 h-7 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{assessment.title}</h3>
                                            <p className="text-sm text-gray-500">{assessment.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Clock className="w-4 h-4" />
                                            {assessment.duration}
                                        </div>
                                    </CardBody>
                                </Card>
                            );
                        })}
                    </div>

                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">
                            Your responses are analyzed by AI to provide accurate skill evaluation.
                        </p>
                        <Button onClick={handleStart} size="lg">
                            Start Assessment
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Active assessment screen
    const currentQuestion = currentSession?.questions[currentSession.currentQuestionIndex];
    const progress = currentSession
        ? ((currentSession.responses.length + 1) / Math.max(currentSession.questions.length, 5)) * 100
        : 0;

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Progress bar */}
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-primary-600 h-full transition-all duration-300"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Question {(currentSession?.responses.length || 0) + 1}</span>
                    <button
                        onClick={abandonAssessment}
                        className="text-red-500 hover:text-red-600"
                    >
                        Exit Assessment
                    </button>
                </div>

                {isCompleting ? (
                    <Card>
                        <CardBody className="py-16 text-center">
                            <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Your Responses</h2>
                            <p className="text-gray-500">Our AI is evaluating your skills based on your answers...</p>
                        </CardBody>
                    </Card>
                ) : currentQuestion ? (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                                    {currentQuestion.skillTargeted.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                                    {currentQuestion.difficulty}
                                </span>
                            </div>
                        </CardHeader>
                        <CardBody className="space-y-6">
                            {currentQuestion.context && (
                                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
                                    {currentQuestion.context}
                                </div>
                            )}

                            <h2 className="text-lg font-medium text-gray-900">
                                {currentQuestion.question}
                            </h2>

                            {currentQuestion.type === 'multiple_choice' && currentQuestion.options ? (
                                <div className="space-y-3">
                                    {currentQuestion.options.map((option, i) => (
                                        <label
                                            key={i}
                                            className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${currentAnswer === option
                                                    ? 'border-primary-500 bg-primary-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="answer"
                                                value={option}
                                                checked={currentAnswer === option}
                                                onChange={(e) => setCurrentAnswer(e.target.value)}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${currentAnswer === option ? 'border-primary-500' : 'border-gray-300'
                                                }`}>
                                                {currentAnswer === option && (
                                                    <div className="w-3 h-3 bg-primary-500 rounded-full" />
                                                )}
                                            </div>
                                            <span className="text-gray-700">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <textarea
                                    value={currentAnswer}
                                    onChange={(e) => setCurrentAnswer(e.target.value)}
                                    placeholder="Type your response here..."
                                    className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                                />
                            )}

                            <div className="flex justify-between items-center pt-4">
                                {currentQuestion.timeLimit && (
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        Suggested time: {Math.floor(currentQuestion.timeLimit / 60)} min
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    {(currentSession?.responses.length || 0) >= 5 && (
                                        <Button variant="outline" onClick={handleComplete}>
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Complete Assessment
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleSubmitAnswer}
                                        disabled={!currentAnswer.trim()}
                                        isLoading={isSubmitting}
                                    >
                                        Submit & Continue
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                ) : (
                    <Card>
                        <CardBody className="py-16 text-center">
                            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Assessment Complete!</h2>
                            <p className="text-gray-500 mb-6">
                                Your skill profile has been updated based on this assessment.
                            </p>
                            <Button onClick={() => window.location.href = '/dashboard'}>
                                View Your Profile
                            </Button>
                        </CardBody>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
