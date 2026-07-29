import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { apiClient } from '../api/client';
import { BookOpen, Calendar, User, ArrowRight } from 'lucide-react';

export const BlogList: React.FC = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await apiClient.get('/cms/blogs');
        setBlogs(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  return (
    <div className="min-h-screen bg-[#080B11] text-gray-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full py-12 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-black text-white">GAMING NEWS & TOP-UP GUIDES</h1>
          <p className="text-sm text-gray-400">Latest patch updates, top-up tutorials & pro gaming strategies</p>
        </div>

        {loading ? (
          <p className="text-xs text-gray-400 text-center">Loading articles...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <div key={blog._id} className="glass-panel glass-panel-hover rounded-3xl overflow-hidden flex flex-col border border-gray-800">
                <img src={blog.thumbnail} alt={blog.title} className="w-full h-48 object-cover" />
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-widest">{blog.tags?.[0] || 'Guide'}</span>
                    <h3 className="text-lg font-black text-white leading-snug hover:text-cyan-300">{blog.title}</h3>
                    <p className="text-xs text-gray-400 line-clamp-3">{blog.content.replace(/<[^>]*>?/gm, '')}</p>
                  </div>
                  <div className="pt-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
                    <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                    <Link to={`/blogs/${blog.slug}`} className="text-cyan-400 font-bold flex items-center space-x-1 hover:underline">
                      <span>Read Guide</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
