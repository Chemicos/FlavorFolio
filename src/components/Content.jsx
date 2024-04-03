/* eslint-disable react/prop-types */
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

export default function Content({ handlePostClick }) {
    const [showFilter, setShowFilter] = useState(false)

  return (
    <div className="bg-ff-content flex flex-col w-4/5 h-auto rounded-3xl shadow-md">
        <div className="flex flex-row justify-between gap-2 px-10 py-4">
            <button 
                className="bg-ff-btn px-3 py-2 rounded-lg shadow flex items-center gap-3 border border-ff-btn
                duration-300 transition-all ease-in-out transform hover:scale-105"
                onClick={() => setShowFilter(!showFilter)}
            >
                Filter
                <FontAwesomeIcon icon={faBars} /> 
            </button>

                {showFilter && 
                    <div className={`flex flex-row gap-6 transition-opacity duration-500 ease-out ${showFilter ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                        <button className="flex flex-row gap-3 items-center px-3 py-2 rounded-lg shadow border border-black
                        hover:bg-ff-btn hover:border-ff-btn duration-300 transition-all ease-in-out transform hover:scale-105">
                            Meal
                            <FontAwesomeIcon icon={faBars} /> 
                        </button>
                        <button className="px-3 py-2 rounded-lg shadow border border-black
                        hover:bg-ff-btn hover:border-ff-btn duration-300 transition-all ease-in-out transform hover:scale-105">
                            Favorites
                        </button>
                        <button className="flex flex-row gap-3 items-center px-3 py-2 rounded-lg shadow border border-black
                        hover:bg-ff-btn hover:border-ff-btn duration-300 transition-all ease-in-out transform hover:scale-105">
                            Difficulty
                            <FontAwesomeIcon icon={faBars} />
                        </button>
                        <button className="flex flex-row gap-3 items-center px-3 py-2 rounded-lg shadow border border-black
                        hover:bg-ff-btn hover:border-ff-btn duration-300 transition-all ease-in-out transform hover:scale-105">
                            Duration
                            <FontAwesomeIcon icon={faBars} />
                        </button>
                        <button className="flex flex-row gap-3 items-center px-3 py-2 rounded-lg shadow border border-black
                        hover:bg-ff-btn hover:border-ff-btn duration-300 transition-all ease-in-out transform hover:scale-105">
                            Ingredients 
                            <FontAwesomeIcon icon={faBars} />
                        </button>
                    </div>
                }
                
            <button 
                className="bg-ff-btn px-4 py-2 rounded-lg shadow border border-ff-btn
                transition duration-300 ease-in-out hover:scale-125"
                onClick={handlePostClick}
            >
                Post
            </button>
        </div>
    </div>
  )
}