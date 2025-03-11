import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { remark } from 'remark';
import html from 'remark-html';

interface DocPageProps {
  params: {
    slug: string[];
  };
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const slug = params.slug.join('/');
  const filePath = path.join(process.cwd(), 'docs', `${slug}`);
  
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const firstLine = fileContents.split('\n')[0];
    const title = firstLine.replace(/^#\s+/, '');
    
    return {
      title: `${title} | Graphic Novel Reader Documentation`,
      description: `Documentation for ${title}`,
    };
  } catch (err) {
    return {
      title: 'Documentation | Graphic Novel Reader',
      description: 'Documentation for Graphic Novel Reader',
    };
  }
}

export default async function DocPage({ params }: DocPageProps) {
  const slug = params.slug.join('/');
  const filePath = path.join(process.cwd(), 'docs', `${slug}`);
  
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    
    // Process markdown to HTML
    const processedContent = await remark()
      .use(html)
      .process(fileContents);
    
    const contentHtml = processedContent.toString();
    
    return (
      <div className="container py-10 max-w-4xl mx-auto">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </div>
      </div>
    );
  } catch (err) {
    notFound();
  }
} 