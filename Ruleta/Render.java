/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package Ruleta;

/**
 *
 * @author OMGM
 */
import java.awt.Color;
import java.awt.Component;
import javax.swing.JLabel;
import javax.swing.JTable;
import javax.swing.table.DefaultTableCellRenderer;

/**
 *
 * @author OMGM
 */
public class Render extends DefaultTableCellRenderer{
    
    private JLabel Componente;
    
    public Component getTableCellRendererComponent(JTable table, Object value, boolean isSelected, boolean hasFocus, int row, int column) 
    {
        Componente = (JLabel) super.getTableCellRendererComponent(table, value, isSelected, hasFocus, row, column);
        String Valor =  (String) table.getValueAt(row, 3);
        System.out.println(Valor);
        if (Valor.equals("N"))
        {
            setBackground(Color.BLACK);
            setForeground(Color.WHITE);
        }
        if (Valor.equals("R"))
        {
            setBackground(Color.RED);
            setForeground(Color.WHITE);
        }
        return super.getTableCellRendererComponent(table, value, isSelected, hasFocus, row, column);
    }
    
}
