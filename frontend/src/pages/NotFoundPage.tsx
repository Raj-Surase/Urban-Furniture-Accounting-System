import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Home, Database, Shield, ArrowLeft } from 'lucide-react';
import { Button, Card } from '@heroui/react';
import { PageTransition } from '../components/layout/PageTransition';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-xl text-center"
        >
          <Card className="border border-white/[0.08] bg-[#15151a] shadow-[0_20px_80px_rgba(0,0,0,0.85)] rounded-[28px] p-6 sm:p-8 md:p-10 overflow-hidden">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-[#7042f4]/15 border border-[#7042f4]/30 text-[#c084fc] flex items-center justify-center shadow-lg shadow-[#7042f4]/10">
                <Compass className="w-8 h-8 animate-spin-slow" />
              </div>

              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#7042f4]/15 text-[#c084fc] border border-[#7042f4]/25 mb-3">
                  HTTP 404 &bull; Missing Route
                </span>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-sans">
                  Lost in Space?
                </h1>
                <p className="text-sm text-white/50 mt-2 max-w-md mx-auto font-sans leading-relaxed">
                  The URL you navigated to does not exist in this console. Check the address or jump to a verified route below.
                </p>
              </div>

              {/* Quick destination links */}
              <div className="pt-4 pb-4">
                <div className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3 font-sans">
                  Quick Shortcuts
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Link to="/">
                    <Button
                      size="sm"
                      variant="flat"
                      className="font-semibold rounded-full bg-white/[0.05] text-white/80 border border-white/[0.08] hover:bg-white/[0.1] hover:text-white active:scale-95 transition-all text-xs"
                      startContent={<Home className="w-3.5 h-3.5 text-[#c084fc]" />}
                    >
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/items">
                    <Button
                      size="sm"
                      variant="flat"
                      className="font-semibold rounded-full bg-white/[0.05] text-white/80 border border-white/[0.08] hover:bg-white/[0.1] hover:text-white active:scale-95 transition-all text-xs"
                      startContent={<Database className="w-3.5 h-3.5 text-cyan-400" />}
                    >
                      Items Directory
                    </Button>
                  </Link>
                  <Link to="/admin">
                    <Button
                      size="sm"
                      variant="flat"
                      className="font-semibold rounded-full bg-white/[0.05] text-white/80 border border-white/[0.08] hover:bg-white/[0.1] hover:text-white active:scale-95 transition-all text-xs"
                      startContent={<Shield className="w-3.5 h-3.5 text-amber-400" />}
                    >
                      Admin Console
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-center gap-3 pt-5 border-t border-white/[0.06]">
                <Button
                  variant="flat"
                  className="font-bold rounded-full bg-white/[0.05] border border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.1] active:scale-[0.98] transition-all px-5"
                  startContent={<ArrowLeft className="w-4 h-4" />}
                  onPress={() => navigate(-1)}
                >
                  Go Back
                </Button>
                <Link to="/">
                  <Button className="font-bold rounded-full bg-white text-black hover:bg-white/90 shadow-md active:scale-[0.98] transition-all px-6">
                    Return to Safety
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default NotFoundPage;
