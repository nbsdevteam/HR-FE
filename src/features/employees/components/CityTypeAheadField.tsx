import { useState, useCallback } from "react";
import { Check, Plus, X } from "lucide-react";
import { TypeAhead } from "@/shared/components";
import { useIsArabicLanguage } from "@/i18n/useLocalizedName";
import { arabicSource } from "@/i18n/source";
import type { GeoCity } from "@/shared/api/geo";
import CityDidYouMeanOption from "./CityDidYouMeanOption";

const getCityId = (city: GeoCity): string => String(city.id);
const inputClass = "w-full bg-transparent border-b-2 border-primary/40 focus:border-primary px-1 py-1.5 text-foreground outline-none transition-colors";

type CityTypeAheadFieldProps = {
  cities: GeoCity[];
  value: string;
  disabled: boolean;
  placeholder: string;
  fallbackLabels?: Record<string, string>;
  openUpward?: boolean;
  onChange: (cityId: string) => void;
  onSearch: (query: string) => void;
  citySuggestions: GeoCity[];
  creatingCity: boolean;
  cityCreateError: string | null;
  onAddCity: (name: string) => Promise<GeoCity | null>;
  onConfirmAddCity: () => Promise<GeoCity | null>;
  onDismissSuggestions: () => void;
  onCitySelected: (city: GeoCity) => void;
};

const CityTypeAheadField = ({
  cities,
  value,
  disabled,
  placeholder,
  fallbackLabels,
  openUpward,
  onChange,
  onSearch,
  citySuggestions,
  creatingCity,
  cityCreateError,
  onAddCity,
  onConfirmAddCity,
  onDismissSuggestions,
  onCitySelected,
}: CityTypeAheadFieldProps) => {
  const [addingCity, setAddingCity] = useState(false);
  const [newCityName, setNewCityName] = useState("");
  const isArabic = useIsArabicLanguage();

  const getCityLabel = useCallback(
    (city: GeoCity): string => (isArabic ? city.name_ar || city.name : city.name),
    [isArabic],
  );

  const handleToggleAddCity = (): void => {
    setAddingCity((prev) => !prev);
    setNewCityName("");
    onDismissSuggestions();
  };

  const handleCancelAddCity = (): void => {
    setAddingCity(false);
    setNewCityName("");
    onDismissSuggestions();
  };

  const handleNewCityNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setNewCityName(e.target.value);
  };

  const handleConfirmAddCity = async (): Promise<void> => {
    const city = await onAddCity(newCityName);
    if (city) {
      onCitySelected(city);
      setAddingCity(false);
      setNewCityName("");
    }
  };

  const handleNewCityNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && newCityName.trim()) {
      void handleConfirmAddCity();
    } else if (e.key === "Escape") {
      handleCancelAddCity();
    }
  };

  const handleCreateAnyway = async (): Promise<void> => {
    const city = await onConfirmAddCity();
    if (city) {
      onCitySelected(city);
      setAddingCity(false);
      setNewCityName("");
    }
  };

  const hasSuggestions = citySuggestions.length > 0;

  return (
    <div>
      <TypeAhead
        items={cities}
        getId={getCityId}
        getLabel={getCityLabel}
        value={value}
        onChange={onChange}
        onQueryChange={onSearch}
        remoteFilter
        fallbackLabels={fallbackLabels}
        placeholder={placeholder}
        disabled={disabled}
        openUpward={openUpward}
      />

      {!disabled && !addingCity && !hasSuggestions && (
        <button
          type="button"
          onClick={handleToggleAddCity}
          className="mt-1 flex items-center gap-1 text-primary hover:text-primary/80 transition-colors cursor-pointer"
          style={{ fontSize: 11 }}
        >
          <Plus className="w-3 h-3" />
          {arabicSource("shared.add_a_new_city")}
        </button>
      )}

      {addingCity && !hasSuggestions && (
        <div className="mt-1.5 flex items-center gap-2">
          <input
            autoFocus
            value={newCityName}
            onChange={handleNewCityNameChange}
            onKeyDown={handleNewCityNameKeyDown}
            placeholder={arabicSource("shared.write_the_name_of_the_new_city")}
            className={inputClass}
            style={{ fontSize: 13 }}
            disabled={creatingCity}
          />
          <button
            onClick={handleConfirmAddCity}
            disabled={!newCityName.trim() || creatingCity}
            className="p-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={handleCancelAddCity}
            disabled={creatingCity}
            className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {hasSuggestions && (
        <div className="mt-1.5 p-2 rounded-lg bg-muted/10 border border-border/30 space-y-1.5">
          <p className="text-muted-foreground" style={{ fontSize: 11 }}>
            {arabicSource("shared.similar_cities_found")}
          </p>
          {citySuggestions.map((suggestion) => (
            <CityDidYouMeanOption
              key={suggestion.id}
              city={suggestion}
              label={getCityLabel(suggestion)}
              onSelect={onCitySelected}
            />
          ))}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={handleCreateAnyway}
              disabled={creatingCity}
              className="text-primary hover:text-primary/80 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ fontSize: 11 }}
            >
              {arabicSource("shared.create_new_city_anyway")}
            </button>
            <button
              onClick={handleCancelAddCity}
              disabled={creatingCity}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ fontSize: 11 }}
            >
              {arabicSource("common.cancel")}
            </button>
          </div>
        </div>
      )}

      {cityCreateError && (
        <p className="mt-1 text-destructive" style={{ fontSize: 11 }}>
          {cityCreateError}
        </p>
      )}
    </div>
  );
};

export default CityTypeAheadField;
