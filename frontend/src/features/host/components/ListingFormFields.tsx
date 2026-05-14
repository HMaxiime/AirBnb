import { UseFormReturn } from "react-hook-form";
import { ListingFormData } from "../schemas/listing";

interface Props { form: UseFormReturn<ListingFormData> }

export function ListingFormFields({ form }: Props): React.JSX.Element {
  const { register, formState: { errors } } = form;

  const inputCls =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#ff5a5f]";

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
        <input {...register("title")} placeholder="Beachfront Villa with Ocean View" className={inputCls} />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
        <textarea rows={4} {...register("description")} placeholder="Describe your property in detail…"
          className={`${inputCls} resize-none`} />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
          <input {...register("location")} placeholder="Bali, Indonesia" className={inputCls} />
          {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
          <select {...register("category")} className={`${inputCls} bg-white`}>
            <option value="house">House</option>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Price per night ($)</label>
          <input type="number" {...register("price")} min={10} className={inputCls} />
          {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Max guests</label>
          <input type="number" {...register("guests")} min={1} max={50} placeholder="1" className={inputCls} />
          {errors.guests && <p className="text-red-500 text-xs mt-1">{errors.guests.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Available from</label>
        <input type="date" {...register("availableFrom")} className={inputCls} />
        {errors.availableFrom && <p className="text-red-500 text-xs mt-1">{errors.availableFrom.message}</p>}
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
        <input type="checkbox" {...register("available")} className="accent-[#ff5a5f] w-4 h-4" />
        Available now
      </label>
    </div>
  );
}
