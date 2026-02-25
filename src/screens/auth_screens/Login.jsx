import React, { useState } from 'react';
import { HiUser, HiLockClosed, HiShieldCheck, HiOutlineMail, HiArrowLeft, HiKey, HiCheckCircle } from 'react-icons/hi';
import { MdSecurity } from 'react-icons/md';

const Login = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Request, 2: Success/Check Email

  const overlayGradient = {
    background: `
      radial-gradient(circle at bottom, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
      linear-gradient(180deg, #046C26 0%, rgba(255, 255, 255, 0) 35%)
    `
  };

  const handleResetRequest = (e) => {
    e.preventDefault();
    // Simulate API call
    setStep(2);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setStep(1), 300); // Reset to step 1 after modal closes
  };

  return (
    <div className="flex min-h-screen w-full font-inter bg-white overflow-hidden">
      {/* Left Section: Hero/Branding */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-cover bg-center text-white"
        style={{ backgroundImage: `url('src/assets/login-img.png')` }}
      >
        <div className="absolute inset-0 z-0" style={overlayGradient}></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img src="src/assets/visaia_logo.png" alt="VISAIA" className="w-15 h-15 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">VISAIA</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-90">Department of Agriculture</p>
            </div>
          </div>

          <div className="mt-24 max-w-lg">
            <h2 className="text-5xl font-extrabold leading-[1.1] mb-8 tracking-tight">
              Pest Monitoring & <br /> Early Warning System
            </h2>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-xl max-w-sm shadow-xl">
              <p className="text-lg leading-relaxed font-normal opacity-95">
                An integrated decision support system designed for government administrators to protect food security and crop health
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <div className="bg-black/20 backdrop-blur-md border border-white/10 p-4 rounded-xl inline-flex items-center gap-4 max-w-md">
            <div className="text-green-400 text-4xl"><MdSecurity /></div>
            <p className="text-sm font-medium leading-snug">
              This is a secure government portal. All activities are monitored and logged.
            </p>
          </div>
        </div>
      </div>

      {/* Right Section: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-16 relative">
        <div className="w-full max-w-md">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Employee Login</h2>
          <p className="text-gray-500 mb-10 font-medium">
            Please enter your credentials to access the administrative dashboard.
          </p>

          <form className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Employee ID</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 group-focus-within:text-green-600 transition-colors">
                  <HiUser className="text-xl" />
                </span>
                <input
                  type="text"
                  placeholder="DA000234"
                  className="block w-full pl-11 pr-3 py-3.5 border border-gray-300 rounded-lg bg-gray-50/50 focus:ring-2 focus:ring-green-600 focus:bg-white transition-all outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 group-focus-within:text-green-600 transition-colors">
                  <HiLockClosed className="text-xl" />
                </span>
                <input
                  type="password"
                  placeholder="***************"
                  className="block w-full pl-11 pr-3 py-3.5 border border-gray-300 rounded-lg bg-gray-50/50 focus:ring-2 focus:ring-green-600 focus:bg-white transition-all outline-none font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
              </label>
              <button 
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-sm font-bold text-green-700 hover:text-green-800 transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-[#3d7a44] hover:bg-[#34693a] text-white font-bold py-4 px-4 rounded-lg transition-all shadow-lg text-lg active:scale-[0.98]"
            >
              Login
            </button>
          </form>

          <div className="mt-16 flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <HiShieldCheck className="text-green-600 text-3xl shrink-0" />
            <p className="text-xs font-medium text-gray-500 leading-relaxed">
              This system contains confidential government information. Log in only if you are an authorized administrator. <a href="#" className="text-green-700 font-bold hover:underline">Learn about data privacy.</a>
            </p>
          </div>
        </div>

        {/* FORGOT PASSWORD FLOW */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md" onClick={closeModal}></div>

            <div className="relative bg-white w-full max-w-[400px] rounded-3xl shadow-2xl border border-gray-100 overflow-hidden p-10 flex flex-col items-center text-center animate-in zoom-in duration-200">
              
              {step === 1 ? (
                /* STEP 1: REQUEST FORM */
                <>
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
                    <HiKey className="text-3xl text-[#3d7a44]" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Forget password?</h3>
                  <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                    we'll send you the updated instructions shortly.
                  </p>

                  <form className="w-full space-y-6" onSubmit={handleResetRequest}>
                    <div className="text-left">
                      <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Email</label>
                      <input
                        required
                        type="email"
                        placeholder="Enter your email"
                        className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-green-600 outline-none font-medium placeholder:text-gray-300"
                      />
                    </div>
                    <button type="submit" className="w-full bg-[#3d7a44] hover:bg-[#34693a] text-white font-bold py-3.5 px-4 rounded-xl shadow-md">
                      Reset password
                    </button>
                    <button type="button" onClick={closeModal} className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-green-700 mx-auto">
                      <HiArrowLeft /> Back to Login
                    </button>
                  </form>
                </>
              ) : (
                /* STEP 2: EMAIL SENT SUCCESS */
                <div className="animate-in fade-in duration-500">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <HiCheckCircle className="text-4xl text-[#3d7a44]" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h3>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    We have sent a password recover link to your email address.
                  </p>
                  
                  <div className="bg-gray-50 rounded-2xl p-4 mb-8">
                    <p className="text-xs text-gray-500 font-medium">
                      Didn't receive the email? Check your spam folder or <button className="text-[#3d7a44] font-bold hover:underline">click to resend</button>.
                    </p>
                  </div>

                  <button 
                    onClick={closeModal}
                    className="w-full border-2 border-gray-100 hover:bg-gray-50 text-gray-700 font-bold py-3.5 px-4 rounded-xl transition-all"
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;