import { Fragment } from "react";
import { Transition } from "@headlessui/react";
import numeral from "numeral";
import { useStore } from "../../../store/StoreContext";
import { useListings } from "../hooks/useListings";
import "./SavedListings.css";

export function SavedListings() {
  const { state } = useStore();
  const { data: listings = [] } = useListings();
  const savedListings = listings.filter((listing) =>
    state.saved.includes(listing.id),
  );

  return (
    <Transition
      as={Fragment}
      show={savedListings.length > 0}
      enter="transition ease-out duration-300"
      enterFrom="transform opacity-0 translate-x-full"
      enterTo="transform opacity-100 translate-x-0"
      leave="transition ease-in duration-300"
      leaveFrom="transform opacity-100 translate-x-0"
      leaveTo="transform opacity-0 translate-x-full"
    >
      <div className="saved-listings-panel">
        <div className="saved-listings-header">
          <h2>Saved Listings</h2>
          <span className="saved-count">{savedListings.length}</span>
        </div>

        <div className="saved-listings-list">
          {savedListings.map((listing) => (
            <div key={listing.id} className="saved-listing-item">
              <img
                src={listing.img}
                alt={listing.title}
                className="saved-listing-image"
              />
              <div className="saved-listing-info">
                <h3>{listing.title}</h3>
                <p className="saved-listing-location">{listing.location}</p>
                <p className="saved-listing-price">
                  {numeral(listing.price).format("$0")}/night
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Transition>
  );
}
