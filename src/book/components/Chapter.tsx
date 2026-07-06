import { ReactNode } from 'react';

interface ChapterProps {
  title: string;
  content: ReactNode;
}

function Chapter({
  title,
  content,
}: ChapterProps) {
  return (
    <section className="mb-12 scroll-mt-4">
      <div className="border-l-[6px] border-[#80298F] pl-6 mb-6">
        <h2 className="chapter-heading">{title}</h2>
      </div>
      <div className="text-slate-700 leading-relaxed chapter-content">{content}</div>
    </section>
  );
}

export default Chapter;
