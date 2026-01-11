import React from 'react';
import { Users, MessageCircle, GraduationCap, BookOpen, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom'

function App() {
  const navigate = useNavigate()
  
  const handleNavigateToLogin = () => {
    navigate('/login')
    console.log('Navigate to login page');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-300 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-400 rounded-full blur-3xl opacity-20"></div>
      </div>

      {/* Main Content */}
      <div className="relative min-h-screen flex items-center justify-center px-6">
        <div className="max-w-4xl w-full text-center space-y-12">
          
          {/* Logo & University Name */}
          <div className="space-y-4">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:rotate-6 transition-transform duration-300">
                  <GraduationCap className="w-14 h-14 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 leading-tight">
              SUT Community
            </h1>
            
            <p className="text-xl md:text-2xl text-orange-600 font-medium">
              Suranaree University of Technology
            </p>
          </div>

          {/* Description */}
          <div className="space-y-4">
            <p className="text-2xl text-gray-700 leading-relaxed max-w-2xl mx-auto">
              ชุมชนออนไลน์สำหรับนักศึกษา มหาวิทยาลัยเทคโนโลยีสุรนารี
            </p>
            <p className="text-lg text-gray-600">
              เชื่อมต่อ แบ่งปัน และเติบโตไปด้วยกัน
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-1">
            <button 
              onClick={handleNavigateToLogin}
               className="group px-12 py-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xl font-semibold rounded-full hover:shadow-2xl transition-all duration-300 hover:scale-105 inline-flex items-center gap-3"
            >
              เข้าสู่ระบบ
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-orange-100">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <MessageCircle className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">แชทสนทนา</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-orange-100">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <BookOpen className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">แชร์ความรู้</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-orange-100">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">กิจกรรม</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-orange-100">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">สร้างเครือข่าย</p>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-12">
            <p className="text-gray-500 text-sm">
              © 2024 SUT Community · Suranaree University of Technology
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;