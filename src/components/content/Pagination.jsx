/* eslint-disable react/prop-types */
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"


export default function Pagination({ currentPage, totalPages, onPageChange }) {
    const pages = [...Array(totalPages).keys()].map(number => number + 1)
  return (
    <div className="flex justify-center my-4">
         <button
                className={`mx-2 px-3 py-1 rounded-xl hover:scale-110 duration-150 ${currentPage === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-ff-btn hover:bg-ff-btn-dark'}`}
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            {pages.map(page => (
                <button
                    key={page}
                    className={`mx-1 px-3 py-1 rounded-xl font-bold hover:scale-110 duration-150 ${currentPage === page ? 'bg-ff-btn-dark text-white' : 'bg-ff-btn hover:bg-ff-btn-dark'}`}
                    onClick={() => onPageChange(page)}
                >
                    {page}
                </button>
            ))}
            <button
                className={`mx-2 px-3 py-1 rounded-xl hover:scale-110 duration-150 ${currentPage === totalPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-ff-btn hover:bg-ff-btn-dark'}`}
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
            >
                <FontAwesomeIcon icon={faArrowRight} />
            </button>
    </div>
  )
}
