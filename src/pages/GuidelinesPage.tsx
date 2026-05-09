import { motion } from 'framer-motion';
import { Navbar } from '../components/ui/Navbar';
import { BookOpen, Users, UserCheck, UploadCloud, CheckCircle, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const guidelinesSteps = [
  {
    id: 1,
    title: "Registering Your Team",
    icon: <Users className="text-cobalt-light" size={24} />,
    description: "Begin your journey by creating an account and registering your team. Ensure all members are added correctly to avoid issues later.",
    details: [
      "Navigate to the 'Get Started' section and choose 'Student' role.",
      "Enter your department, roll number, and team details.",
      "Once registered, you'll gain access to the Student Dashboard."
    ],
    image: "/screenshots/register-team.png",
    alt: "Register Team Interface"
  },
  {
    id: 2,
    title: "Allocation of Guide",
    icon: <UserCheck className="text-emerald-400" size={24} />,
    description: "After registration, the Admin will allocate a faculty guide to your team based on your department category (Software, Core, Circuit).",
    details: [
      "Guides are allocated dynamically via the Admin Portal.",
      "You will see your allocated guide's details on your Dashboard.",
      "Your guide will review and approve your milestones."
    ],
    image: "/screenshots/guide-allocation.png",
    alt: "Guide Allocation Interface"
  },
  {
    id: 3,
    title: "Project Uploads & Submissions",
    icon: <UploadCloud className="text-purple-400" size={24} />,
    description: "Submit your project documents, code links, and milestone updates through the secure Upload Portal.",
    details: [
      "Use the 'Upload Portal' to submit new versions.",
      "All uploads are tracked in the 'Version History'.",
      "Include repository URLs and deployment links."
    ],
    image: "/screenshots/project-uploads.png",
    alt: "Project Upload Interface"
  },
  {
    id: 4,
    title: "Review Process",
    icon: <CheckCircle className="text-amber-400" size={24} />,
    description: "Your allocated guide will review your submissions and provide feedback directly within the portal.",
    details: [
      "Guides can approve, request changes, or reject submissions.",
      "Real-time notifications are sent for all review actions.",
      "Incorporate feedback and re-upload if necessary."
    ],
    image: "/screenshots/review-process.png",
    alt: "Review Process Interface"
  },
  {
    id: 5,
    title: "Final Review (Academic Gate)",
    icon: <Award className="text-rose-400" size={24} />,
    description: "The ultimate 5-level Academic Gate review involves comprehensive evaluation by multiple department heads and external reviewers.",
    details: [
      "Every team has to present their project in front of an external panel.",
      "Marks will be awarded for each presentation and evaluation phase.",
      "Final approval required for project graduation."
    ]
  }
];

export function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-navy text-slate font-sans selection:bg-cobalt/30">
      <Navbar />
      
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 text-center"
          >
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-cobalt/10 text-cobalt-light mb-6 ring-1 ring-cobalt/20">
              <BookOpen size={32} />
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter mb-6">
              Step-by-Step <span className="text-transparent bg-clip-text bg-gradient-to-r from-cobalt-light to-emerald-400">Guidelines</span>
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Master the AcademiSync workflow. Follow these visual instructions to successfully navigate the platform from initial registration to final project approval.
            </p>
          </motion.div>

          <div className="space-y-24">
            {guidelinesSteps.map((step, index) => (
              <motion.div 
                key={step.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`flex flex-col gap-12 lg:items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}
              >
                {/* Text Content */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      {step.icon}
                    </div>
                    <span className="text-slate-500 font-mono font-bold tracking-widest text-sm">STEP 0{step.id}</span>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-white">{step.title}</h2>
                  <p className="text-slate-400 text-lg leading-relaxed">
                    {step.description}
                  </p>
                  
                  <ul className="space-y-3 mt-6">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-300">
                        <CheckCircle size={20} className="text-cobalt-light shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Image / Visual Reference */}
                {step.image && (
                  <div className="flex-1 w-full">
                    <div className="relative group">
                      {/* Decorative glow */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-cobalt-light to-emerald-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                      
                      <div className="relative rounded-2xl overflow-hidden glass border border-white/10 bg-slate-900/80 aspect-[16/10] flex items-center justify-center">
                        <img 
                          src={step.image} 
                          alt={step.alt}
                          className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                          onError={(e) => {
                            // Fallback to placeholder if image not found
                            const target = e.target as HTMLImageElement;
                            target.src = `https://placehold.co/800x500/0f172a/3b82f6?text=${step.title.replace(/ /g, '+')}&font=inter`;
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-32 text-center"
          >
            <div className="glass-card inline-block p-10 max-w-3xl border-cobalt/20 shadow-[0_0_40px_rgba(37,99,235,0.1)]">
              <h3 className="text-2xl font-bold text-white mb-4">Ready to start your project?</h3>
              <p className="text-slate-400 mb-8">Join AcademiSync today and experience a seamless academic management workflow.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register" className="px-8 py-4 rounded-xl bg-cobalt text-white font-bold hover:bg-cobalt-light transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                  Register Now
                </Link>
                <Link to="/login" className="px-8 py-4 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all border border-white/10">
                  Sign In
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
