import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

export default function ProductCard({ product }) {
  return (
    <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full border border-slate-100">
      <Link to={`/product/${product.id}`} className="relative block overflow-hidden aspect-[3/4]">
        <img
          src={product.image_url}
          alt={product.name}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 bg-slate-900/90 text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded">
          {product.category}
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-grow">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">
          Velvet & Thread
        </span>
        <Link to={`/product/${product.id}`} className="text-slate-800 hover:text-slate-900 font-semibold text-sm line-clamp-1 mb-2">
          {product.name}
        </Link>
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4 flex-grow">
          {product.description}
        </p>

        <div className="flex justify-between items-center mt-auto pt-2 border-t border-slate-50">
          <span className="text-sm font-black text-slate-900">
            ${parseFloat(product.price).toFixed(2)}
          </span>
          <Link
            to={`/product/${product.id}`}
            className="flex items-center gap-1.5 bg-slate-150 text-slate-800 hover:bg-slate-900 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
          >
            <span>View Options</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
