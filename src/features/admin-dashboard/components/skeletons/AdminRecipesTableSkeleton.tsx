import AdminRecipesTableRowSkeleton from "./AdminRecipesTableRowSkeleton"

export default function AdminRecipesTableSkeleton() {
    return (
        <tbody>
            {Array.from({ length: 10 }).map((_, index) => (
                <AdminRecipesTableRowSkeleton key={index}/>
            ))}
        </tbody>
    )
}