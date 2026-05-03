"use client"

import { useState } from "react"

export default function Waste(){

  const [ingredient,setIngredient] = useState("")
  const [qty,setQty] = useState("")

  const submitWaste = async ()=>{

    const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    await fetch(`${API}/api/inventory/waste/`,{

      method:"POST",

      headers:{
        "Content-Type":"application/json"
      },

      body:JSON.stringify({
        store_id:1,
        ingredient_id:ingredient,
        quantity:qty,
        notes:"Damaged"
      })

    })

    alert("Waste Recorded")

  }

  return(

    <div>

      <h1 className="text-3xl font-bold mb-6">
        Record Waste
      </h1>
      <input
      className="bg-[#1b1f2a] border border-[#2a2f3c] p-3 rounded w-full mb-4"
      placeholder="Ingredient ID"

              onChange={(e)=>setIngredient(e.target.value)}
      />
      
      <input
        placeholder="Quantity"
        onChange={(e)=>setQty(e.target.value)}
      />

      <button onClick={submitWaste}>
        Submit
      </button>

    </div>

  )

}