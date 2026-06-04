import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded"
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded"

import { useState } from "react"
import PostRecipeSteps from "./PostRecipeSteps"
import { PostRecipeStep, PostRecipeIngredient } from "../../types/postRecipe.types"
import PostRecipeIngredients from "./PostRecipeIngredients"


interface PostRecipeFormProps {
  onClose: () => void
}

export default function PostRecipeForm({onClose}: PostRecipeFormProps) {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [cuisine, setCuisine] = useState("")
    const [duration, setDuration] = useState("")
    const [servings, setServings] = useState("")

    const fieldClass = "w-full rounded-md border border-white/10 bg-[#0b0b0c] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#6f7892] hover:border-white/20 focus:border-orange-400/50 focus:ring-2 focus:ring-orange-500/10"
    const labelClass = "mb-2 block text-xs font-medium text-[#a8b3cf]"

    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState("")

    const [ingredients, setIngredients] = useState<PostRecipeIngredient[]>([])
    const [steps, setSteps] = useState<PostRecipeStep[]>([])

    const handleMainImageChange = (file?: File) => {
        if (!file) return

        setImageFile(file)
        setImagePreview(URL.createObjectURL(file))
    }

    return (
    <form className="min-h-full">
      <div className="relative">
        <label className="group relative flex h-[340px] w-full cursor-pointer items-center justify-center overflow-hidden bg-[#0b0b0c]">
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Recipe preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center text-[#7f89a6] group-hover:text-orange-200">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] transition group-hover:scale-105 group-active:scale-95 group-hover:border-orange-400/50 group-hover:bg-orange-500/20">
                <CameraAltRoundedIcon sx={{ fontSize: 32 }} />
              </div>

              <span className="mt-4 text-sm font-medium ">Upload recipe image</span>
            </div>
          )}

          {imagePreview && (
            <div className="absolute inset-0 bg-black/0 transition duration-200 group-hover:bg-black/25" />
          )}

          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#16181d] to-transparent" />

          {imagePreview && (
            <div 
              className="absolute bottom-16 right-6 z-20 flex items-center gap-2 rounded-lg border border-white/10 bg-[#0b0b0c]/70 px-4 py-2 text-sm text-white backdrop-blur-xl transition
              group-hover:border-orange-300/30 group-hover:bg-orange-500/20 group-hover:text-orange-100"
            >
              <CameraAltRoundedIcon sx={{ fontSize: 16 }} />
              <span>Change image</span>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleMainImageChange(event.target.files?.[0])}
          />
        </label>

        <button
          type="button"
          onClick={onClose}
          className="absolute left-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full hover:backdrop-blur-xl text-white transition-all duration-200 hover:bg-orange-500/20 hover:scale-105 active:scale-90"
        >
          <ArrowBackIosNewRoundedIcon sx={{ fontSize: 18 }} />
        </button>
      </div>

      <div className="relative z-10 -mt-10 rounded-t-[2.8rem] bg-[#16181d] px-7 pb-8 pt-10">
        <p className="text-sm font-medium text-[#a8b3cf]">Create recipe</p>
        <h2 className="mt-1 text-[1.5rem] font-medium text-white">New post</h2>

        <div className="mt-8 flex flex-col gap-5">
          <div>
            <label className={labelClass}>Title *</label>
            <input 
              value={title} 
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Recipe title"
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>Description *</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe your recipe..."
              rows={5}
              className={`${fieldClass} resize-none leading-7`}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Cuisine</label>
              <input
                value={cuisine}
                onChange={(event) => setCuisine(event.target.value)}
                placeholder="Italian"
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>Duration</label>
              <input
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                placeholder="40 min"
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>Servings</label>
              <input
                value={servings}
                onChange={(event) => setServings(event.target.value)}
                placeholder="4"
                inputMode="numeric"
                className={fieldClass}
              />
            </div>
          </div>

          <PostRecipeIngredients ingredients={ingredients} onChange={setIngredients} />
          <PostRecipeSteps steps={steps} onChange={setSteps} />
        </div>

        <div className="sticky bottom-0 -mx-7 mt-8 flex justify-end gap-3 border-t border-white/10 bg-[#16181d]/95 px-7 py-4 backdrop-blur-xl z-50">
          <button
            type="button"
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-[#a8b3cf] transition hover:bg-white/[0.04] hover:text-white"
          >
            Preview
          </button>

          <button
            type="submit"
            className="rounded-lg bg-orange-500/10 border border-orange-400/20 px-6 py-2.5 text-sm font-semibold text-orange-200 transition hover:border-orange-300/30 hover:bg-orange-500/20 hover:text-orange-100"
          >
            Post
          </button>
        </div>
      </div>
    </form>
  )
}
