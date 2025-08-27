import { useAuth } from '../../features/auth/context/AuthProvider';
import Logo from '../../assets/logo.png';
import { useNavigate } from 'react-router';

export default function Header({

    isSticky = false,
    visible = true,
    className = '',
}) {

    const { currentUserData, isMenuOpen, setIsMenuOpen, handleLoginClick, currentUserProfile } = useAuth();
    const navigate = useNavigate()


    const onProfileClick = () => {
        setIsMenuOpen(false)
        if (currentUserData) {
            navigate(`/myprofile`);
        } else {
            handleLoginClick();
        }
    };
    return (
        <>
            <header
                className={`
        ${isSticky
                        ? `fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/70 border-b transition-transform duration-300 ${visible ? 'translate-y-0' : '-translate-y-full'
                        }`
                        : 'bg-white shadow-sm border-b'}
        ${className}
      `}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center font-mozilla">
                            <img src={Logo} className="w-10 h-10 mr-1" />
                            <h1 className="text-2xl font-black text-gray-900">Poker</h1>
                        </div>
                        <div className="hidden md:flex items-center gap-4 ">
                            {currentUserData ? (
                                <div className='flex items-center gap-2 '>
                                    <button
                                        onClick={onProfileClick}
                                        className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors pl-2 max-w-[150px]"
                                    >
                                        {currentUserProfile?.ImageUrl ? (
                                            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                                                <img
                                                    src={currentUserProfile?.ImageUrl}
                                                    className="object-cover h-full w-full"
                                                    alt="Profile"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                                {/* <User className="w-3 h-3 text-blue-600" /> */}
                                            </div>
                                        )}

                                        <span className="font-medium truncate block">
                                            {currentUserProfile?.Name}
                                        </span>
                                    </button>

                                </div>
                            ) : (
                                <div className='flex items-center gap-2 '>
                                    <button
                                        onClick={handleLoginClick}
                                        className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors px-4"
                                    >
                                        {/* <User className="w-4 h-4" /> */}
                                        Login
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Mobile view: hamburger toggle */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 text-gray-700 hover:text-gray-900 focus:outline-none"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    {isMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>


                    </div>
                    {isMenuOpen && (
                        <div className="absolute top-16 right-4 w-48 bg-white border rounded-lg shadow-lg z-50 p-3 space-y-2">

                            {currentUserData ? (
                                <>
                                    <button
                                        onClick={onProfileClick}
                                        className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors py-2 max-w-[150px]"
                                    >
                                        {currentUserProfile?.ImageUrl ? (
                                            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                                                <img
                                                    src={currentUserProfile?.ImageUrl}
                                                    className="object-cover h-full w-full"
                                                    alt="Profile"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                                {/* <User className="w-3 h-3 text-blue-600" /> */}
                                            </div>
                                        )}

                                        <span className="font-medium truncate block">
                                            {currentUserProfile?.Name}
                                        </span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={handleLoginClick}
                                        className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors py-2"
                                    >
                                        {/* <User className="w-4 h-4" /> */}
                                        Login
                                    </button>
                                </>
                            )}

                        </div>
                    )}

                </div>
            </header>

        </>

    );
}
