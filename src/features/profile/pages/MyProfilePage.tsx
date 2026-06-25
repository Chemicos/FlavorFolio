import { useEffect, useMemo, useState } from "react";
import Navigation from "../../../components/layout/Navigation";
import MyProfileHeader from "../components/MyProfileHeader";
import ProfileRecipeTabs, { ProfileRecipeTabItem, ProfileRecipeTabValue } from "../components/ProfileRecipeTabs";
import ProfileRecipeToolbar, { ProfileRecipeSortValue, ProfileRecipeViewMode } from "../components/ProfileRecipeToolbar";
import ProfileRecipeGrid, { ProfileRecipeGridItem } from "../components/ProfileRecipeGrid";
import { useMyProfile } from "../hooks/useMyProfile";
import { useMyProfileRecipes } from "../hooks/useMyProfileRecipes";
import ProfileRecipeGridSkeleton from "../components/ProfileRecipeGridSkeleton";
import { useDebounce } from "../../recipe-review/hooks/useDebounce";
import MyProfileEditForm from "../components/MyProfileEditForm";
import { useSnackbar } from "../../../components/layout/SnackbarProvider";
import { Recipe } from "../../home/types";
import { CurrentUserCardData } from "../../home/types/recipeCard.types";
import { fetchProfileRecipeById } from "../services/profileRecipes.service";
import { AnimatePresence } from "motion/react";
import ViewRecipeDrawer from "../../home/components/recipe-view-drawer/ViewRecipeDrawer";

export default function MyProfilePage() {
  const [activeRecipeTab, setActiveRecipeTab] = useState<ProfileRecipeTabValue>("my-recipes")
  const { 
    userId,
    profile, 
    isLoading: isProfileLoading,
    isBannerUploading,
    isAvatarUploading,
    uploadBannerImage,
    uploadAvatarImage,
    isProfileSaving,
    saveProfile,
  } = useMyProfile()

  const {
    recipes,
    savedRecipes,
    isLoading: isRecipesLoading,
    error: recipesError,
    deleteRecipe,
  } = useMyProfileRecipes(userId)

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [isRecipeDrawerLoading, setIsRecipeDrawerLoading] = useState(false)

  const { showSnackbar } = useSnackbar()

  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 1000)
  const isSearching = searchQuery.trim() !== debouncedSearchQuery.trim()

  const [sortBy, setSortBy] = useState<ProfileRecipeSortValue>("latest")
  const [category, setCategory] = useState("all")
  const [viewMode, setViewMode] = useState<ProfileRecipeViewMode>("grid")
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  const recipeTabs = useMemo<ProfileRecipeTabItem[]>(
    () => [
      {
        value: "my-recipes",
        label: "My recipes",
        count: recipes.filter((recipe) => recipe.status === "published").length,
      },
      {
        value: "saved-recipes",
        label: "Saved recipes",
        count: savedRecipes.length,
      },
      {
        value: "pending-recipes",
        label: "Pending",
        count: recipes.filter((recipe) => recipe.status === "pending").length,
      },
      {
        value: "needs-revision",
        label: "Needs revision",
        count: recipes.filter((recipe) => recipe.status === "needs_revision").length,
      },
      {
        value: "drafts",
        label: "Drafts",
        count: recipes.filter((recipe) => recipe.status === "draft").length,
      },
    ],[recipes, profile?.stats.savedRecipesCount]
  )

  const categories = useMemo(
    () => ["Breakfast", "Lunch", "Dinner", "Dessert", "Snack"],[]
  )

  const currentUser = useMemo<CurrentUserCardData | null>(() => {
    if (!userId || !profile) return null

    return {
      uid: userId,
      username: profile.username || "",
      profileImage: profile.profileImage || "",
    }
  }, [userId, profile])

  const handleOpenRecipeDrawer = async (recipe: ProfileRecipeGridItem) => {
    try {
      setIsRecipeDrawerLoading(true)

      const fullRecipe = await fetchProfileRecipeById(recipe.id)
      setSelectedRecipe(fullRecipe)
    } catch (error) {
      console.error("Failed to open recipe:", error)
      showSnackbar("Failed to open recipe. Please try again.", "error")
    } finally {
      setIsRecipeDrawerLoading(false)
    }
  }

  const visibleRecipes = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase()
    const sourceRecipes = activeRecipeTab === "saved-recipes" ? savedRecipes : recipes

    const filteredByTab = sourceRecipes.filter((recipe) => {
      if (activeRecipeTab === "my-recipes") {
        return recipe.status === "published"
      }

      if (activeRecipeTab === "pending-recipes") {
        return recipe.status === "pending"
      }

      if (activeRecipeTab === "needs-revision") {
        return recipe.status === "needs_revision"
      }

      if (activeRecipeTab === "drafts") {
        return recipe.status === "draft"
      }

      if (activeRecipeTab === "saved-recipes") {
        return true
      }

      return true
    })


    const filteredBySearch = filteredByTab.filter((recipe) => {
      if (!query) return true

      return [
        recipe.title,
        recipe.meal,
        recipe.difficulty,
        recipe.category,
        recipe.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    })

    const filteredByCategory = filteredBySearch.filter((recipe) => {
      if (category === "all") return true

      return recipe.category.toLowerCase() === category.toLowerCase()
    })

    return [...filteredByCategory].sort((a, b) => {
      if (sortBy === "oldest") {
        return (
          new Date(a.createdAt || "").getTime() -
          new Date(b.createdAt || "").getTime()
        )
      }

      if (sortBy === "popular") {
        return b.savesCount + b.commentsCount - (a.savesCount + a.commentsCount)
      }

      if (sortBy === "highest-rated") {
        return b.rating - a.rating
      }

      return (
        new Date(b.createdAt || "").getTime() -
        new Date(a.createdAt || "").getTime()
      )
    })
  }, [recipes, savedRecipes, activeRecipeTab, debouncedSearchQuery, category, sortBy])
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#16181d] text-white">
      <div className="relative z-10">
        <Navigation variant="solid" />

        <main className="mx-auto w-full max-w-[1400px] px-6 pt-28 xl:px-10">

          {isEditingProfile ? (
            <MyProfileEditForm
              profile={profile}
              isSaving={isProfileSaving}
              onCancel={() => setIsEditingProfile(false)}
              onSave={async (payload) => {
                try {
                  await saveProfile(payload)
                  setIsEditingProfile(false)
                  showSnackbar("Profile updated successfully.", "success")
                } catch (error) {
                  console.error("Failed to update profile:", error)
                  showSnackbar("Failed to update profile. Please try again.", "error")
                }
              }}
            />
          ) : (
            <MyProfileHeader
              username={profile?.username || "User"}
              fullName={profile?.fullName || "User"}
              bio={profile?.bio || "Food lover & recipe creator."}
              profileImage={profile?.profileImage || ""}
              bannerImage={profile?.bannerImage || ""}
              location={profile?.location || "Location not set"}
              website={profile?.website || "Website not set"}
              joinedLabel={profile?.joinedLabel || "Joined recently"}
              recipesCount={recipes.length}
              followersCount={profile?.stats.followersCount || 0}
              followingCount={profile?.stats.followingCount || 0}
              savesCount={profile?.stats.savedRecipesCount || 0}
              onEditProfile={() => setIsEditingProfile(true)}
              onChangeAvatar={uploadAvatarImage}
              isAvatarUploading={isAvatarUploading}
              onChangeBanner={uploadBannerImage}
              isBannerUploading={isBannerUploading}
            />
          )}

          <div className="sticky top-20 z-40 bg-[#16181d] pb-5">
            <ProfileRecipeTabs
              activeTab={activeRecipeTab}
              onTabChange={setActiveRecipeTab}
              tabs={recipeTabs}
            />

            <ProfileRecipeToolbar
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              resultCount={visibleRecipes.length}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              category={category}
              onCategoryChange={setCategory}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              categories={categories}
            />
          </div>


          {(isRecipesLoading || isSearching) && (
            <ProfileRecipeGridSkeleton viewMode={viewMode} count={8} />
          )}

          {recipesError && (
            <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-6 text-sm text-red-200">
              {recipesError}
            </div>
          )}

          {!isRecipesLoading && !isSearching && !recipesError && (
            <ProfileRecipeGrid
              recipes={visibleRecipes}
              viewMode={viewMode}
              onRecipeClick={handleOpenRecipeDrawer}
              onRecipeDelete={(recipe) => {
                deleteRecipe(recipe.id)
              }}
            />
          )}
        </main>

        <AnimatePresence>
          {selectedRecipe && currentUser && (
            <ViewRecipeDrawer
              recipe={selectedRecipe}
              currentUser={currentUser}
              savedRecipes={savedRecipes.map((recipe) => ({
                recipeId: recipe.id,
              }))}
              followingUserIds={[]}
              authorFollowersCount={
                Number(selectedRecipe.author?.followersCount || 0)
              }
              onClose={() => setSelectedRecipe(null)}
              onFollowStateChange={() => {}}
              onFavoriteStateChange={() => {}}
              onRatingStateChange={() => {}}
              onCommentStateChange={() => {}}
              onEditRecipe={(recipe) => {
                console.log("Edit recipe from profile drawer", recipe)
              }}
              onDeleteRecipe={(recipeId) => {
                deleteRecipe(recipeId)
                setSelectedRecipe(null)
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
