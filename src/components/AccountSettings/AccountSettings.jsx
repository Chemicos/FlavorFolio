import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Navigation from "../Navigation";
import { faUser } from "@fortawesome/free-regular-svg-icons";
import { faPlus } from "@fortawesome/free-solid-svg-icons";


export default function AccountSettings() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-x-hidden gap-8">
      <Navigation />

      <div className="flex flex-row justify-center">
        <div className="flex flex-col items-start gap-2 w-[300px]">
            <button>Editeaza profilul</button>
            <button>Gestionarea contului</button>
            <button className="mt-10">Inapoi</button>
        </div>

        <div className="w-[500px] flex flex-col gap-6 px-4">
            <div className="flex flex-col items-center sm:items-start sm:flex-row gap-4">
                <label className="relative flex flex-col justify-center cursor-pointer w-32 h-32 rounded-full border 
                    border-black hover:bg-ff-btn hover:border-ff-btn duration-300">
                    <FontAwesomeIcon icon={faUser} className="text-4xl" />
                            
                    <input 
                    type="file" 
                    // onChange={handleImageUpload} 
                    className="hidden"
                    />
                </label>

                <div className="flex flex-col items-center sm:items-start gap-4">
                    <span className="font-semibold text-xl">username</span>

                    <p className="italic opacity-70">Description</p>

                    <button className="border border-black font-semibold rounded-lg py-2 px-2
                        hover:bg-ff-btn hover:border-ff-btn duration-150"
                    >
                        Sterge imaginea
                    </button>
                </div>
            </div>

            <form className="flex flex-col gap-8">
                <div className="flex flex-col sm:flex-row gap-4">
                    <input 
                        className="bg-transparent w-full border 
                            border-black rounded-2xl p-2 placeholder:text-black placeholder:opacity-40 placeholder:italic" 
                        type="text"
                        placeholder="Nume"
                    />
                    <input 
                        className="bg-transparent w-full border 
                            border-black rounded-2xl p-2 placeholder:text-black placeholder:opacity-40 placeholder:italic" 
                        type="text" 
                        placeholder="Prenume"
                    />
                </div>

                <input 
                    className="bg-transparent border border-black rounded-2xl p-2 
                        placeholder:text-black placeholder:opacity-40 placeholder:italic" 
                    type="text"
                    placeholder="Despre" 
                />
                <input 
                    className="bg-transparent border border-black rounded-2xl p-2 
                        placeholder:text-black placeholder:opacity-40 placeholder:italic" 
                    type="text"
                    placeholder="Nume utilizator"
                />

                <div className="flex flex-col gap-8">
                    <h1 className="text-xl font-semibold">
                        Profiluri sociale
                    </h1>

                    <input 
                        className="bg-transparent border border-black rounded-2xl p-2 
                            placeholder:text-black placeholder:opacity-40 placeholder:italic" 
                        type="text"
                        placeholder="Ex. Instagram"
                    />
                    
                    <div className="flex flex-col w-full gap-2">
                        <div className="flex flex-row justify-between">
                            <span className="text-lg">Adauga</span>

                            <button className="flex items-center justify-center h-[30px] w-[30px] borde rounded-full
                                hover:bg-ff-btn duration-200"
                            >
                                <FontAwesomeIcon icon={faPlus} />
                            </button>
                        </div>
                        
                        <span className="bg-black opacity-20 h-[1px]"></span>
                    </div>
                </div>
            </form>
        </div>
      </div>
    </div>
  )
}