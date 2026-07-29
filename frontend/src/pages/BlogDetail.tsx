import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { apiClient } from '../api/client';
import { ArrowLeft, Calendar, User } from 'lucide-react';

export const BlogDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await apiClient.get(`/cms/blogs/${slug}`);
        setBlog(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080B11] text-gray-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080B11] text-gray-100 flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full py-12 space-y-8">
        <Link to="/blogs" className="inline-flex items-center space-x-2 text-xs font-bold text-cyan-400 hover:text-cyan-300">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to News & Guides</span>
        </Link>

        {blog && (
          <article className="space-y-6">
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">{blog.title}</h1>
            <div className="flex items-center space-x-4 text-xs text-gray-400 pb-4 border-b border-gray-800">
              <span>Published on {new Date(blog.createdAt).toLocaleDateString()}</span>
              <span>By {blog.author}</span>
            </div>
            <img src={blog.thumbnail} alt={blog.title} className="w-full h-80 object-cover rounded-3xl glass-panel" />
            <div className="prose prose-invert max-w-none text-gray-300 text-sm leading-relaxed space-y-4">
              {blog.content}
            </div>
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
};
