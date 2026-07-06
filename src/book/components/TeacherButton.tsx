import { useEffect, useState } from 'react';
import { publicUrl } from '@shared/lib/publicUrl';
import { useOptionalAnalytics } from '@analytics/SessionProvider';
import {
  buildTeacherButtonIds,
  closeTeacherButtonBySection,
  trackTeacherButtonOpened,
} from '@analytics/teacherButtonTracking';

interface TeacherButtonProps {
    title?: string;
    content?: React.ReactNode;
    answers?: React.ReactNode;
    visible?: boolean;
    /** Página do livro onde o botão aparece (para analytics). */
    page: number;
}

function TeacherButton({
    title,
    content,
    answers,
    visible = true,
    page,
}: TeacherButtonProps) {
    const analytics = useOptionalAnalytics();
    const [isOpen, setIsOpen] = useState(false);
    const { section_id: sectionId } = buildTeacherButtonIds(page);

    const openModal = () => {
        // Analytics: somente clique intencional neste handler (onClick do botão).
        // Não dispara em mount, re-render, scroll ou page_viewed.
        if (analytics) {
            const ids = buildTeacherButtonIds(page);
            trackTeacherButtonOpened({
                sessionId: analytics.sessionId,
                ...ids,
                track: analytics.track,
            });
        }
        setIsOpen(true);
    };

    const closeModal = () => {
        if (analytics) {
            closeTeacherButtonBySection(sectionId, analytics.track);
        }
        setIsOpen(false);
    };

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeModal();
        };
        window.addEventListener('keydown', onKeyDown);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen]);

    if (!visible) {
        return null;
    }

    return (
        <>
            <button
                type="button"
                onClick={openModal}
                className="professor-button"
                style={{
                    position: 'relative',
                    padding: '10px 30px 10px 45px',
                    backgroundColor: '#80298F',
                    boxShadow: '0px 4px 0px rgb(106, 37, 118)',
                    borderRadius: '0 30px 30px 0',
                    color: 'white',
                    fontFamily: "'Ubuntu', sans-serif",
                    fontSize: '12px',
                    fontWeight: 700,
                    lineHeight: '1.4em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    margin: '1em 0.4em 1.4em 1.4em',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(106, 37, 118)';
                    e.currentTarget.style.boxShadow = '0px 2px 0px rgb(106, 37, 118)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#80298F';
                    e.currentTarget.style.boxShadow = '0px 4px 0px rgb(106, 37, 118)';
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: '-15px',
                        top: '54%',
                        transform: 'translateY(-50%)',
                        width: '45px',
                        height: '45px',
                        borderRadius: '50%',
                        backgroundColor: '#80298F',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1,
                        background: `transparent url("${publicUrl('images/iconTeacher.svg')}") no-repeat center`,
                        backgroundSize: '100%',
                    }}
                />
                PARA O PROFESSOR
            </button>

            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={closeModal}
                >
                    <div
                        className="bg-white rounded-lg p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <p 
                                className="text-2xl font-bold"
                                style={{ 
                                    color: '#80298F',
                                    fontFamily: "'myriad-vf', sans-serif",
                                    fontSize: '26px',
                                    lineHeight: 'normal',
                                    fontWeight: 700,
                                }}
                            >
                                PARA O PROFESSOR
                            </p>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="text-slate-500 hover:text-slate-700 text-2xl font-bold"
                                aria-label="Fechar conteúdo do professor"
                            >
                                ×
                            </button>
                        </div>

                        {title && (
                            <h4 className="text-xl font-semibold text-slate-700 mb-4">{title}</h4>
                        )}

                        {content && (
                            <div className="mb-6">
                                <div className="prose max-w-none" style={{ color: '#000000' }}>
                                    {content}
                                </div>
                            </div>
                        )}

                        {answers && (
                            <div>
                                <h5 className="text-lg font-semibold mb-3" style={{ color: '#000000' }}>Respostas:</h5>
                                <div className="prose max-w-none" style={{ color: '#000000' }}>
                                    {answers}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </>
    );
}

export default TeacherButton;
